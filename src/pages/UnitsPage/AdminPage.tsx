import React, { Suspense } from "react";
import { Container, Stack, CircularProgress, Box } from "@mui/material";

// Lazy loading для всех admin компонентов
const ProjectsTable = React.lazy(() => import("../../widgets/ProjectsTable"));
const ContractorAdmin = React.lazy(() => import("../../widgets/ContractorAdmin"));
const BrigadesAdmin = React.lazy(() => import("../../widgets/BrigadesAdmin"));
const ClaimStatusesAdmin = React.lazy(() => import("../../widgets/ClaimStatusesAdmin"));
const DefectTypesAdmin = React.lazy(() => import("../../widgets/DefectTypesAdmin"));
const DefectStatusesAdmin = React.lazy(() => import("../../widgets/DefectStatusesAdmin"));
const UsersTable = React.lazy(() => import("../../widgets/UsersTable"));
const CourtCaseStatusesAdmin = React.lazy(() => import("../../widgets/CourtCaseStatusesAdmin"));
const LawsuitClaimTypesAdmin = React.lazy(() => import("../../widgets/LawsuitClaimTypesAdmin"));
const LetterTypesAdmin = React.lazy(() => import("../../widgets/LetterTypesAdmin"));
const LetterStatusesAdmin = React.lazy(() => import("../../widgets/LetterStatusesAdmin"));
const RolePermissionsAdmin = React.lazy(() => import("../../widgets/RolePermissionsAdmin"));

const AdminLoader = () => (
  <Box display="flex" justifyContent="center" p={2}>
    <CircularProgress size={24} />
  </Box>
);

export default function AdminPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Suspense fallback={<AdminLoader />}>
          <ProjectsTable pageSize={5} rowsPerPageOptions={[5, 10, 25, 50, 100]} />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <ContractorAdmin pageSize={5} rowsPerPageOptions={[5, 10, 25, 50, 100]} />
        </Suspense>
        
        <Suspense fallback={<AdminLoader />}>
          <BrigadesAdmin pageSize={5} rowsPerPageOptions={[5, 10, 25, 50, 100]} />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <ClaimStatusesAdmin
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <DefectTypesAdmin
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <DefectStatusesAdmin
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <CourtCaseStatusesAdmin
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <LawsuitClaimTypesAdmin
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <LetterTypesAdmin
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <LetterStatusesAdmin
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <UsersTable pageSize={5} rowsPerPageOptions={[5, 10, 25, 50, 100]} />
        </Suspense>

        <Suspense fallback={<AdminLoader />}>
          <RolePermissionsAdmin />
        </Suspense>
      </Stack>
    </Container>
  );
}
