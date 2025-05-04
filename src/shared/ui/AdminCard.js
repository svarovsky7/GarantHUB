import { Card, CardHeader, CardContent, Divider, Box } from '@mui/material'; // CHANGE: IconButton удалён

/**
 * Карточка админ-блока с заголовком и action-кнопкой.
 */
const AdminCard = ({ title, action, maxHeight = 0, children }) => (
    <Card
        sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 2,
        }}
    >
        <CardHeader
            title={title}
            action={action ? <Box sx={{ ml: 1 }}>{action}</Box> : null}
            sx={{ pb: 1, '& .MuiCardHeader-action': { alignSelf: 'center' } }}
        />
        <Divider />
        <CardContent
            sx={{
                flexGrow: 1,
                p: 0,
                overflowX: 'auto',
                ...(maxHeight && { maxHeight, overflowY: 'auto' }),
            }}
        >
            {children}
        </CardContent>
    </Card>
);

export default AdminCard;
