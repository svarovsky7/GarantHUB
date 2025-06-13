import React from "react";
import { Container, Stack } from "@mui/material";

import ProjectsTable from "../../widgets/ProjectsTable";
import ContractorAdmin from "../../widgets/ContractorAdmin";
import TicketStatusesAdmin from "../../widgets/TicketStatusesAdmin";
import TicketTypesAdmin from "../../widgets/TicketTypesAdmin";
import DefectDeadlinesAdmin from "../../widgets/DefectDeadlinesAdmin";
import UsersTable from "../../widgets/UsersTable";
import LitigationStagesAdmin from "../../widgets/LitigationStagesAdmin";
import LetterTypesAdmin from "../../widgets/LetterTypesAdmin";
import AttachmentTypesAdmin from "../../widgets/AttachmentTypesAdmin";
import LetterStatusesAdmin from "../../widgets/LetterStatusesAdmin";

export default function AdminPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <ProjectsTable pageSize={25} rowsPerPageOptions={[10, 25, 50, 100]} />

        <ContractorAdmin pageSize={25} rowsPerPageOptions={[10, 25, 50, 100]} />

        <TicketStatusesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />

        <TicketTypesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />

        <DefectDeadlinesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />

        <LitigationStagesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />


        <LetterTypesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />

        <LetterStatusesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />

        <AttachmentTypesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />

        <UsersTable pageSize={25} rowsPerPageOptions={[10, 25, 50, 100]} />
      </Stack>
    </Container>
  );
}
