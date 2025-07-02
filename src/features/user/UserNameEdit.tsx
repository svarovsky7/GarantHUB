import React from 'react';
import { Input } from 'antd';
import { useUpdateUserName } from '@/entities/user';
import { useNotify } from '@/shared/hooks/useNotify';
import type { User } from '@/shared/types/user';

/**
 * Инлайн-редактор имени пользователя.
 */
export default function UserNameEdit({ user }: { user: User }) {
  const updateName = useUpdateUserName();
  const notify = useNotify();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState<string>(user.name ?? '');

  React.useEffect(() => {
    setValue(user.name ?? '');
  }, [user.name]);

  const save = () => {
    updateName.mutate(
      { id: user.id, name: value || null },
      {
        onSuccess: () => {
          setEditing(false);
          notify.success('Имя обновлено');
        },
        onError: (e) => notify.error(e.message),
      },
    );
  };

  if (!editing) {
    return (
      <span onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        {user.name ?? '—'}
      </span>
    );
  }

  return (
    <Input
      size="small"
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onPressEnter={save}
      disabled={updateName.isPending}
    />
  );
}
