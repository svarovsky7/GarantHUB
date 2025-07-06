import React from "react";
import { Container, Stack } from "@mui/material";

import ProjectsTable from "../../widgets/ProjectsTable";
import ContractorAdmin from "../../widgets/ContractorAdmin";
import BrigadesAdmin from "../../widgets/BrigadesAdmin";
import ClaimStatusesAdmin from "../../widgets/ClaimStatusesAdmin";
import DefectTypesAdmin from "../../widgets/DefectTypesAdmin";
import DefectStatusesAdmin from "../../widgets/DefectStatusesAdmin";
import UsersTable from "../../widgets/UsersTable";
import CourtCaseStatusesAdmin from "../../widgets/CourtCaseStatusesAdmin";
import LawsuitClaimTypesAdmin from "../../widgets/LawsuitClaimTypesAdmin";
import LetterTypesAdmin from "../../widgets/LetterTypesAdmin";
import LetterStatusesAdmin from "../../widgets/LetterStatusesAdmin";
import RolePermissionsAdmin from "../../widgets/RolePermissionsAdmin";

export default function AdminPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <ProjectsTable pageSize={5} rowsPerPageOptions={[5, 10, 25, 50, 100]} />

        <ContractorAdmin pageSize={5} rowsPerPageOptions={[5, 10, 25, 50, 100]} />
        <BrigadesAdmin pageSize={5} rowsPerPageOptions={[5, 10, 25, 50, 100]} />


        <ClaimStatusesAdmin
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />

        <DefectTypesAdmin
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />

        <DefectStatusesAdmin
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />


        <CourtCaseStatusesAdmin
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />

        <LawsuitClaimTypesAdmin
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />


        <LetterTypesAdmin
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />

        <LetterStatusesAdmin
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />


        <UsersTable pageSize={5} rowsPerPageOptions={[5, 10, 25, 50, 100]} />

        <RolePermissionsAdmin />
      </Stack>
    </Container>
  );
}
