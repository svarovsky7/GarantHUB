import React from "react";
import { Container, Stack } from "@mui/material";

import ProjectsTable from "../../widgets/ProjectsTable";
import ContractorAdmin from "../../widgets/ContractorAdmin";
import TicketStatusesAdmin from "../../widgets/TicketStatusesAdmin";
import TicketTypesAdmin from "../../widgets/TicketTypesAdmin";
import UsersTable from "../../widgets/UsersTable";
import LitigationStagesAdmin from "../../widgets/LitigationStagesAdmin";
import PartyTypesAdmin from "../../widgets/PartyTypesAdmin";
import LetterTypesAdmin from "../../widgets/LetterTypesAdmin";

export default function AdminPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }} data-oid="zd3gnr1">
      <Stack spacing={4} data-oid="4ye5apx">
        <ProjectsTable
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          data-oid="8y8lszs"
        />

        <ContractorAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          data-oid="fu68kpx"
        />

        <TicketStatusesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          data-oid="6fz4oqw"
        />

        <TicketTypesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          data-oid="4djg04y"
        />

        <LitigationStagesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          data-oid="99dqyvl"
        />

        <PartyTypesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          data-oid="rvvoje1"
        />

        <LetterTypesAdmin
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          data-oid="rldkmw7"
        />

        <UsersTable
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          data-oid="8y7q0sk"
        />
      </Stack>
    </Container>
  );
}
