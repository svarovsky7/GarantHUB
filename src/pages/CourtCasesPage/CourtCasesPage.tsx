import React, { useState, useMemo, useEffect } from "react";
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

const initialCases: CourtCase[] = [
  {
    id: "1",
    number: "А40-123456/2023",
    date: "2023-05-15",
    projectObject: 'ЖК "Солнечный берег"',
    plaintiff: 'ООО "Строитель"',
    defendant: 'ООО "Генподрядчик"',
    responsibleLawyer: "Иванов И.И.",
    court: "Арбитражный суд г. Москвы",
    status: "active",
    claimAmount: 2500000,
    remediationStartDate: "2023-06-10",
    remediationEndDate: "2023-07-15",
    description:
      "Иск о взыскании задолженности по договору подряда на сумму 2,500,000 руб.",
    letters: [
      {
        id: "101",
        number: "ИСХ-123",
        date: "2023-04-10",
        content: "Претензия о погашении задолженности по договору подряда.",
      },
      {
        id: "102",
        number: "ИСХ-145",
        date: "2023-04-25",
        content: "Уведомление о намерении обратиться в суд.",
      },
    ],
    defects: [
      {
        id: "201",
        name: "Трещины в фундаменте",
        location: "Секция А, оси 1-3",
        description:
          "Обнаружены трещины в фундаменте здания шириной до 5 мм.",
        cost: 850000,
        duration: 30,
      },
      {
        id: "202",
        name: "Протечки кровли",
        location: "Секция Б, кв. 45-48",
        description:
          "Обнаружены протечки кровли в местах примыкания к вентшахтам.",
        cost: 320000,
        duration: 14,
      },
    ],
  },
  {
    id: "2",
    number: "А40-789012/2023",
    date: "2023-06-20",
    projectObject: 'БЦ "Меркурий"',
    plaintiff: 'ООО "Генподрядчик"',
    defendant: 'ООО "Заказчик"',
    responsibleLawyer: "Петров П.П.",
    court: "Арбитражный суд г. Москвы",
    status: "won",
    claimAmount: 5800000,
    remediationStartDate: "",
    remediationEndDate: "",
    description:
      "Иск о взыскании задолженности по договору генерального подряда на сумму 5,800,000 руб.",
    letters: [],
    defects: [],
  },
  {
    id: "3",
    number: "А40-345678/2023",
    date: "2023-07-05",
    projectObject: 'ЖК "Зеленый квартал"',
    plaintiff: 'ТСЖ "Зеленый квартал"',
    defendant: 'ООО "Генподрядчик"',
    responsibleLawyer: "Сидорова С.С.",
    court: "Арбитражный суд г. Москвы",
    status: "active",
    claimAmount: 3200000,
    remediationStartDate: "2023-08-01",
    remediationEndDate: "",
    description:
      "Иск о возмещении ущерба, причиненного некачественным выполнением строительных работ.",
    letters: [
      {
        id: "103",
        number: "ВХ-78",
        date: "2023-06-15",
        content:
          "Претензия от ТСЖ с требованием устранить выявленные недостатки.",
      },
    ],
    defects: [
      {
        id: "203",
        name: "Некачественная отделка фасада",
        location: "Корпус 2, северная сторона",
        description: "Отслоение декоративной штукатурки, выцветание покрытия.",
        cost: 1200000,
        duration: 45,
      },
    ],
  },
];

export default function CourtCasesPage() {
  const [cases, setCases] = useState<CourtCase[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    object: "",
    lawyer: "",
    search: "",
  });
  const [newCase, setNewCase] = useState({
    number: "",
    date: null as Dayjs | null,
    object: "",
    plaintiff: "",
    defendant: "",
    lawyer: "",
    court: "",
    status: "active" as CaseStatus,
    claimAmount: "",
    fixStart: null as Dayjs | null,
    fixEnd: null as Dayjs | null,
    description: "",
  });
  const [dialogCase, setDialogCase] = useState<CourtCase | null>(null);
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setCases(initialCases);
  }, []);

  const handleAddCase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCase.number || !newCase.date || !newCase.object || !newCase.plaintiff || !newCase.defendant || !newCase.lawyer || !newCase.court) return;
    const caseToAdd: CourtCase = {
      id: Date.now().toString(),
      number: newCase.number,
      date: newCase.date.format("YYYY-MM-DD"),
      projectObject: newCase.object,
      plaintiff: newCase.plaintiff,
      defendant: newCase.defendant,
      responsibleLawyer: newCase.lawyer,
      court: newCase.court,
      status: newCase.status,
      claimAmount: Number(newCase.claimAmount) || 0,
      remediationStartDate: newCase.fixStart ? newCase.fixStart.format("YYYY-MM-DD") : "",
      remediationEndDate: newCase.fixEnd ? newCase.fixEnd.format("YYYY-MM-DD") : "",
      description: newCase.description,
      letters: [],
      defects: [],
    };
    setCases((prev) => [...prev, caseToAdd]);
    setNewCase({
      number: "",
      date: null,
      object: "",
      plaintiff: "",
      defendant: "",
      lawyer: "",
      court: "",
      status: "active",
      claimAmount: "",
      fixStart: null,
      fixEnd: null,
      description: "",
    });
    setSnackbar({ message: "Дело успешно добавлено!", type: "success" });
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

  const deleteCase = (id: string) => {
    if (window.confirm("Удалить дело?")) {
      setCases((prev) => prev.filter((c) => c.id !== id));
      setSnackbar({ message: "Дело удалено!", type: "success" });
    }
  };

  const addLetter = (caseId: string, letter: Omit<Letter, "id">) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, letters: [...c.letters, { ...letter, id: Date.now().toString() }] } : c,
      ),
    );
    setSnackbar({ message: "Письмо добавлено!", type: "success" });
  };

  const deleteLetter = (caseId: string, letterId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, letters: c.letters.filter((l) => l.id !== letterId) } : c,
      ),
    );
    setSnackbar({ message: "Письмо удалено!", type: "success" });
  };

  const addDefect = (caseId: string, defect: Omit<Defect, "id">) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, defects: [...c.defects, { ...defect, id: Date.now().toString() }] } : c,
      ),
    );
    setSnackbar({ message: "Недостаток добавлен!", type: "success" });
  };

  const deleteDefect = (caseId: string, defectId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, defects: c.defects.filter((d) => d.id !== defectId) } : c,
      ),
    );
    setSnackbar({ message: "Недостаток удален!", type: "success" });
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
                  <TextField
                    label="Объект"
                    fullWidth
                    required
                    value={newCase.object}
                    onChange={(e) => setNewCase({ ...newCase, object: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Истец"
                    fullWidth
                    required
                    value={newCase.plaintiff}
                    onChange={(e) => setNewCase({ ...newCase, plaintiff: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Ответчик"
                    fullWidth
                    required
                    value={newCase.defendant}
                    onChange={(e) => setNewCase({ ...newCase, defendant: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Ответственный юрист"
                    fullWidth
                    required
                    value={newCase.lawyer}
                    onChange={(e) => setNewCase({ ...newCase, lawyer: e.target.value })}
                  />
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
                    value={newCase.status}
                    onChange={(e) => setNewCase({ ...newCase, status: e.target.value as CaseStatus })}
                    required
                  >
                    <MenuItem value="active">В процессе</MenuItem>
                    <MenuItem value="won">Выиграно</MenuItem>
                    <MenuItem value="lost">Проиграно</MenuItem>
                    <MenuItem value="settled">Урегулировано</MenuItem>
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
                <LettersTab caseId={dialogCase.id} letters={dialogCase.letters} onAdd={addLetter} onDelete={deleteLetter} />
              )}
              {tab === 1 && (
                <DefectsTab caseId={dialogCase.id} defects={dialogCase.defects} onAdd={addDefect} onDelete={deleteDefect} />
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
  caseId: string;
  letters: Letter[];
  onAdd: (caseId: string, letter: Omit<Letter, "id">) => void;
  onDelete: (caseId: string, letterId: string) => void;
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
  caseId: string;
  defects: Defect[];
  onAdd: (caseId: string, defect: Omit<Defect, "id">) => void;
  onDelete: (caseId: string, defectId: string) => void;
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

