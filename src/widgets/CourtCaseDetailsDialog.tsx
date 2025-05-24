import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import dayjs from "dayjs";
import LettersTable from "./LettersTable";
import CaseDefectsTable from "./CaseDefectsTable";
import { useCaseLetters } from "@/entities/letter";
import { useCaseDefects } from "@/entities/caseDefect";

export default function CourtCaseDetailsDialog({ open, caseData, onClose }) {
  const { data: letters = [] } = useCaseLetters(caseData?.id);
  const { data: defects = [] } = useCaseDefects(caseData?.id);
  const [tab, setTab] = useState(0);

  if (!caseData) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      data-oid="jdul4-m"
    >
      <DialogTitle data-oid="ktfpmww">
        Дело № {caseData.internal_no}
      </DialogTitle>
      <DialogContent dividers data-oid="v7dsifd">
        <Stack spacing={1} mb={2} data-oid="uc2tp_-">
          <Typography variant="body2" data-oid="68urfo1">
            Объект: {caseData.unit_name}
          </Typography>
          <Typography variant="body2" data-oid="h9uiu9t">
            Стадия: {caseData.stage_name}
          </Typography>
          <Typography variant="body2" data-oid="obxxiid">
            Статус: {caseData.status}
          </Typography>
          {caseData.fix_start_date && (
            <Typography variant="body2" data-oid="atf1fkg">
              Начало устранения:{" "}
              {dayjs(caseData.fix_start_date).format("DD.MM.YYYY")}
            </Typography>
          )}
          {caseData.fix_end_date && (
            <Typography variant="body2" data-oid="hbfmp-k">
              Завершение устранения:{" "}
              {dayjs(caseData.fix_end_date).format("DD.MM.YYYY")}
            </Typography>
          )}
          {caseData.comments && (
            <Typography variant="body2" data-oid="bhvk037">
              Заметки: {caseData.comments}
            </Typography>
          )}
        </Stack>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
          data-oid="1du4bq-"
        >
          <Tab label="Письма" data-oid="fi1-jpw" />
          <Tab label="Недостатки" data-oid="3o0t.2w" />
        </Tabs>
        {tab === 0 && (
          <LettersTable rows={letters} onEdit={() => {}} data-oid="llpff9_" />
        )}
        {tab === 1 && <CaseDefectsTable rows={defects} data-oid="-8z7it6" />}
      </DialogContent>
      <DialogActions data-oid="luc6:ij">
        <Button onClick={onClose} data-oid="r56uuup">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
}
