import React from 'react';
import { Container, Stack } from '@mui/material';

import ProjectsTable    from '../../widgets/ProjectsTable';
import UnitsTable       from '../../widgets/UnitsTable';
import ContractorAdmin  from '../../widgets/ContractorAdmin';
import PersonsAdmin     from '../../widgets/PersonsAdmin';   // NEW
import UsersTable       from '../../widgets/UsersTable';

export default function AdminPage() {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Stack spacing={4}>
                <ProjectsTable />
                <UnitsTable />
                <ContractorAdmin />
                <PersonsAdmin />          {/* NEW блок */}

                <UsersTable />
            </Stack>
        </Container>
    );
}
