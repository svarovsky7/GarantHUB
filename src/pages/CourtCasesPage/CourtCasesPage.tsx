import React, { useState, useMemo } from "react";
import {
  Grid,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  Select,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Snackbar,
  Slide,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ru";
import type {
  Letter,
  Defect,
  CourtCase,
  CaseStatus,
} from "@/shared/types/courtCase";
import { useProjects } from "@/entities/project";
import { useUnitsByProject } from "@/entities/unit";
import { useContractors } from "@/entities/contractor";
import { useUsers } from "@/entities/user";
import { useLitigationStages } from "@/entities/litigationStage";
import {
  useCourtCases,
  useAddCourtCase,
  useDeleteCourtCase,
  useCaseLetters,
  useAddLetter,
  useDeleteLetter,
  useCaseDefects,
  useAddDefect,
  useDeleteDefect,
} from "@/entities/courtCase";
import { supabase } from "@/shared/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";

const statusText: Record<CaseStatus, string> = {
  active: "В процессе",
  won: "Выиграно",
  lost: "Проиграно",
  settled: "Урегулировано",
};

const statusColor: Record<CaseStatus, "warning" | "success" | "error" | "info"> = {
  active: "warning",
  won: "success",
  lost: "error",
  settled: "info",
};

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);


export default function CourtCasesPage() {
  const { data: cases = [], isPending: casesLoading } = useCourtCases();
  const addCaseMutation = useAddCourtCase();
  const deleteCaseMutation = useDeleteCourtCase();
  const [filters, setFilters] = useState({
    status: "",
    object: "",
    lawyer: "",
    search: "",
  });
  const [newCase, setNewCase] = useState({
    number: "",
    date: null as Dayjs | null,
    project: null as number | null,
    unit: null as number | null,
    plaintiff: null as number | null,
    defendant: null as number | null,
    lawyer: null as string | null,
    court: "",
    status: null as number | null,
    claimAmount: "",
    fixStart: null as Dayjs | null,
    fixEnd: null as Dayjs | null,
    description: "",
  });
  const [dialogCase, setDialogCase] = useState<CourtCase | null>(null);
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: projects = [] } = useProjects();
  const { data: units = [], isPending: unitsLoading } = useUnitsByProject(newCase.project);
  const { data: contractors = [], isPending: contractorsLoading } = useContractors();
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: stages = [], isPending: stagesLoading } = useLitigationStages();
  const { data: persons = [], isPending: personsLoading } = useQuery(
    ["persons", newCase.project],
    async () => {
      const { data, error } = await supabase
        .from("persons")
        .select("id, full_name")
        .eq("project_id", newCase.project)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
    { enabled: !!newCase.project }
  );

  const { data: letters = [] } = useCaseLetters(dialogCase?.id ?? 0);
  const { data: defects = [] } = useCaseDefects(dialogCase?.id ?? 0);
  const addLetterMutation = useAddLetter();
  const deleteLetterMutation = useDeleteLetter();
  const addDefectMutation = useAddDefect();
  const deleteDefectMutation = useDeleteDefect();

  const handleAddCase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !newCase.number ||
      !newCase.date ||
      !newCase.project ||
      !newCase.unit ||
      !newCase.plaintiff ||
      !newCase.defendant ||
      !newCase.lawyer ||
      !newCase.status
    )
      return;

    addCaseMutation.mutate(
      {
        project_id: newCase.project,
        unit_id: newCase.unit,
        number: newCase.number,
        date: newCase.date.format("YYYY-MM-DD"),
        plaintiff_id: newCase.plaintiff,
        defendant_id: newCase.defendant,
        responsible_lawyer_id: newCase.lawyer,
        court: newCase.court,
        status: newCase.status,
        claim_amount: Number(newCase.claimAmount) || null,
        fix_start_date: newCase.fixStart ? newCase.fixStart.format("YYYY-MM-DD") : null,
        fix_end_date: newCase.fixEnd ? newCase.fixEnd.format("YYYY-MM-DD") : null,
        description: newCase.description,
      } as any,
      {
        onSuccess: () => {
          setNewCase({
            number: "",
            date: null,
            project: null,
            unit: null,
            plaintiff: null,
            defendant: null,
            lawyer: null,
            court: "",
            status: null,
            claimAmount: "",
            fixStart: null,
            fixEnd: null,
            description: "",
          });
          setSnackbar({ message: "Дело успешно добавлено!", type: "success" });
        },
        onError: (e: any) =>
          setSnackbar({ message: e.message, type: "error" }),
      }
    );
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const search = filters.search.toLowerCase();
      const matchesSearch =
        c.number.toLowerCase().includes(search) ||
        c.plaintiff.toLowerCase().includes(search) ||
        c.defendant.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search);
      const matchesStatus = !filters.status || c.status === filters.status;
      const matchesObject =
        !filters.object || c.projectObject.toLowerCase().includes(filters.object.toLowerCase());
      const matchesLawyer =
        !filters.lawyer || c.responsibleLawyer.toLowerCase().includes(filters.lawyer.toLowerCase());
      return matchesSearch && matchesStatus && matchesObject && matchesLawyer;
    });
  }, [cases, filters]);

  const deleteCase = (id: number) => {
    if (!window.confirm("Удалить дело?")) return;
    deleteCaseMutation.mutate(id, {
      onSuccess: () => setSnackbar({ message: "Дело удалено!", type: "success" }),
      onError: (e: any) => setSnackbar({ message: e.message, type: "error" }),
    });
  };

  const addLetter = (caseId: number, letter: Omit<Letter, "id">) => {
    addLetterMutation.mutate(
      { ...letter, case_id: caseId },
      {
        onSuccess: () => setSnackbar({ message: "Письмо добавлено!", type: "success" }),
        onError: (e: any) => setSnackbar({ message: e.message, type: "error" }),
      },
    );
  };

  const deleteLetter = (caseId: number, letterId: number) => {
    deleteLetterMutation.mutate(
      { id: letterId, case_id: caseId },
      {
        onSuccess: () => setSnackbar({ message: "Письмо удалено!", type: "success" }),
        onError: (e: any) => setSnackbar({ message: e.message, type: "error" }),
      },
    );
  };

  const addDefect = (caseId: number, defect: Omit<Defect, "id">) => {
    addDefectMutation.mutate(
      { case_id: caseId, ...defect },
      {
        onSuccess: () => setSnackbar({ message: "Недостаток добавлен!", type: "success" }),
        onError: (e: any) => setSnackbar({ message: e.message, type: "error" }),
      },
    );
  };

  const deleteDefect = (caseId: number, defectId: number) => {
    deleteDefectMutation.mutate(
      { id: defectId, case_id: caseId },
      {
        onSuccess: () => setSnackbar({ message: "Недостаток удален!", type: "success" }),
        onError: (e: any) => setSnackbar({ message: e.message, type: "error" }),
      },
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Добавить новое судебное дело
            </Typography>
            <form onSubmit={handleAddCase} id="add-case-form">
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Номер дела"
                    fullWidth
                    required
                    value={newCase.number}
                    onChange={(e) => setNewCase({ ...newCase, number: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Дата открытия"
                    format="DD.MM.YYYY"
                    value={newCase.date}
                    onChange={(v) => setNewCase({ ...newCase, date: v })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Select
                    fullWidth
                    value={newCase.project ?? ""}
                    onChange={(e) =>
                      setNewCase({ ...newCase, project: Number(e.target.value), unit: null, plaintiff: null })
                    }
                    displayEmpty
                    required
                  >
                    <MenuItem value="">Проект</MenuItem>
                    {projects.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Select
                    fullWidth
                    value={newCase.unit ?? ""}
                    onChange={(e) => setNewCase({ ...newCase, unit: Number(e.target.value) })}
                    displayEmpty
                    disabled={!newCase.project || unitsLoading}
                    required
                  >
                    <MenuItem value="">Объект</MenuItem>
                    {units.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Select
                    fullWidth
                    value={newCase.plaintiff ?? ""}
                    onChange={(e) => setNewCase({ ...newCase, plaintiff: Number(e.target.value) })}
                    displayEmpty
                    disabled={!newCase.project || personsLoading}
                    required
                  >
                    <MenuItem value="">Истец</MenuItem>
                    {persons.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Select
                    fullWidth
                    value={newCase.defendant ?? ""}
                    onChange={(e) => setNewCase({ ...newCase, defendant: Number(e.target.value) })}
                    displayEmpty
                    disabled={contractorsLoading}
                    required
                  >
                    <MenuItem value="">Ответчик</MenuItem>
                    {contractors.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Select
                    fullWidth
                    value={newCase.lawyer ?? ""}
                    onChange={(e) => setNewCase({ ...newCase, lawyer: e.target.value as string })}
                    displayEmpty
                    disabled={usersLoading}
                    required
                  >
                    <MenuItem value="">Ответственный юрист</MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Наименование суда"
                    fullWidth
                    required
                    value={newCase.court}
                    onChange={(e) => setNewCase({ ...newCase, court: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Select
                    fullWidth
                    value={newCase.status ?? ""}
                    onChange={(e) => setNewCase({ ...newCase, status: Number(e.target.value) })}
                    displayEmpty
                    disabled={stagesLoading}
                    required
                  >
                    <MenuItem value="">Статус</MenuItem>
                    {stages.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Сумма иска"
                    type="number"
                    value={newCase.claimAmount}
                    onChange={(e) => setNewCase({ ...newCase, claimAmount: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Дата начала устранения"
                    format="DD.MM.YYYY"
                    value={newCase.fixStart}
                    onChange={(v) => setNewCase({ ...newCase, fixStart: v })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Дата завершения устранения"
                    format="DD.MM.YYYY"
                    value={newCase.fixEnd}
                    onChange={(v) => setNewCase({ ...newCase, fixEnd: v })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Описание дела"
                    fullWidth
                    multiline
                    rows={3}
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sx={{ textAlign: "right" }}>
                  <Button variant="contained" type="submit">
                    Добавить дело
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Таблица судебных дел
            </Typography>
            <Grid container spacing={2} className="filter-grid" sx={{ mb: 2 }}>
              <Grid item>
                <Select
                  fullWidth
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">Все статусы</MenuItem>
                  <MenuItem value="active">В процессе</MenuItem>
                  <MenuItem value="won">Выиграно</MenuItem>
                  <MenuItem value="lost">Проиграно</MenuItem>
                  <MenuItem value="settled">Урегулировано</MenuItem>
                </Select>
              </Grid>
              <Grid item>
                <TextField
                  placeholder="Фильтр по объекту"
                  value={filters.object}
                  onChange={(e) => setFilters({ ...filters, object: e.target.value })}
                />
              </Grid>
              <Grid item>
                <TextField
                  placeholder="Фильтр по юристу"
                  value={filters.lawyer}
                  onChange={(e) => setFilters({ ...filters, lawyer: e.target.value })}
                />
              </Grid>
              <Grid item xs>
                <TextField
                  placeholder="Поиск по номеру, истцу, ответчику..."
                  fullWidth
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </Grid>
            </Grid>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>№ дела</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Объект</TableCell>
                  <TableCell>Истец</TableCell>
                  <TableCell>Ответчик</TableCell>
                  <TableCell>Юрист</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Сумма иска</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCases.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.number}</TableCell>
                    <TableCell>{dayjs(c.date).format("DD.MM.YYYY")}</TableCell>
                    <TableCell>{c.projectObject}</TableCell>
                    <TableCell>{c.plaintiff}</TableCell>
                    <TableCell>{c.defendant}</TableCell>
                    <TableCell>{c.responsibleLawyer}</TableCell>
                    <TableCell>
                      <Chip size="small" label={statusText[c.status]} color={statusColor[c.status]} />
                    </TableCell>
                    <TableCell>{fmtCurrency(c.claimAmount)}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => { setDialogCase(c); setTab(0); }}>Просмотр</Button>
                      <Button size="small" color="error" onClick={() => deleteCase(c.id)}>
                        Удалить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Нет судебных дел для отображения
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={!!dialogCase}
        onClose={(_, reason) => {
          if (reason !== "backdropClick") setDialogCase(null);
        }}
        maxWidth="lg"
        fullWidth
        TransitionComponent={Slide}
      >
        <DialogTitle>
          {dialogCase ? `Дело № ${dialogCase.number}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          {dialogCase && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Номер дела</Typography>
                  <Typography>{dialogCase.number}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Дата открытия</Typography>
                  <Typography>{dayjs(dialogCase.date).format("DD.MM.YYYY")}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Объект</Typography>
                  <Typography>{dialogCase.projectObject}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Истец</Typography>
                  <Typography>{dialogCase.plaintiff}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Ответчик</Typography>
                  <Typography>{dialogCase.defendant}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Ответственный юрист</Typography>
                  <Typography>{dialogCase.responsibleLawyer}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Наименование суда</Typography>
                  <Typography>{dialogCase.court}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Статус дела</Typography>
                  <Typography>{statusText[dialogCase.status]}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Сумма иска</Typography>
                  <Typography>{fmtCurrency(dialogCase.claimAmount)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Дата начала устранения</Typography>
                  <Typography>
                    {dialogCase.remediationStartDate
                      ? dayjs(dialogCase.remediationStartDate).format("DD.MM.YYYY")
                      : "Не указано"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Дата завершения устранения</Typography>
                  <Typography>
                    {dialogCase.remediationEndDate
                      ? dayjs(dialogCase.remediationEndDate).format("DD.MM.YYYY")
                      : "Не указано"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption">Описание дела</Typography>
                  <Typography>{dialogCase.description || "Нет описания"}</Typography>
                </Grid>
              </Grid>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Письма" />
                <Tab label="Недостатки и стоимость устранения" />
              </Tabs>
              {tab === 0 && (
                <LettersTab caseId={dialogCase.id} letters={letters} onAdd={addLetter} onDelete={deleteLetter} />
              )}
              {tab === 1 && (
                <DefectsTab caseId={dialogCase.id} defects={defects} onAdd={addDefect} onDelete={deleteDefect} />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar?.message}
      />
    </LocalizationProvider>
  );
}

interface LettersTabProps {
  caseId: number;
  letters: Letter[];
  onAdd: (caseId: number, letter: Omit<Letter, "id">) => void;
  onDelete: (caseId: number, letterId: number) => void;
}

function LettersTab({ caseId, letters, onAdd, onDelete }: LettersTabProps) {
  const [number, setNumber] = useState("");
  const [date, setDate] = useState<Dayjs | null>(null);
  const [content, setContent] = useState("");

  const add = () => {
    if (!number || !date || !content) return;
    onAdd(caseId, { number, date: date.format("YYYY-MM-DD"), content });
    setNumber("");
    setDate(null);
    setContent("");
  };

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Номер письма"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DatePicker
            label="Дата письма"
            value={date}
            onChange={setDate}
            format="DD.MM.YYYY"
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Содержание"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" onClick={add}>Добавить письмо</Button>
        </Grid>
      </Grid>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>№ письма</TableCell>
            <TableCell>Дата</TableCell>
            <TableCell>Содержание</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {letters.map((l) => (
            <TableRow key={l.id} hover>
              <TableCell>{l.number}</TableCell>
              <TableCell>{dayjs(l.date).format("DD.MM.YYYY")}</TableCell>
              <TableCell>{l.content}</TableCell>
              <TableCell>
                <Button size="small" color="error" onClick={() => onDelete(caseId, l.id)}>
                  Удалить
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {letters.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Нет писем для отображения
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}

interface DefectsTabProps {
  caseId: number;
  defects: Defect[];
  onAdd: (caseId: number, defect: Omit<Defect, "id">) => void;
  onDelete: (caseId: number, defectId: number) => void;
}

function DefectsTab({ caseId, defects, onAdd, onDelete }: DefectsTabProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [duration, setDuration] = useState("");

  const add = () => {
    if (!name || !description || !cost) return;
    onAdd(caseId, {
      name,
      location,
      description,
      cost: Number(cost),
      duration: duration ? Number(duration) : null,
    });
    setName("");
    setLocation("");
    setDescription("");
    setCost("");
    setDuration("");
  };

  const total = defects.reduce((sum, d) => sum + d.cost, 0);

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField label="Наименование недостатка" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Местоположение" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Описание недостатка" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Стоимость устранения" type="number" value={cost} onChange={(e) => setCost(e.target.value)} fullWidth />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Срок устранения (дней)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" onClick={add}>Добавить недостаток</Button>
        </Grid>
      </Grid>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Недостаток</TableCell>
            <TableCell>Местоположение</TableCell>
            <TableCell>Стоимость</TableCell>
            <TableCell>Срок</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {defects.map((d) => (
            <TableRow key={d.id} hover>
              <TableCell>
                <Typography fontWeight={500}>{d.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {d.description}
                </Typography>
              </TableCell>
              <TableCell>{d.location || "-"}</TableCell>
              <TableCell>{fmtCurrency(d.cost)}</TableCell>
              <TableCell>{d.duration ?? "-"}</TableCell>
              <TableCell>
                <Button size="small" color="error" onClick={() => onDelete(caseId, d.id)}>
                  Удалить
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {defects.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Нет недостатков для отображения
              </TableCell>
            </TableRow>
          )}
          {defects.length > 0 && (
            <TableRow>
              <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>
                Общая стоимость:
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{fmtCurrency(total)}</TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}

