import React from "react";
import { Input, Skeleton } from "antd";
import { useUpdateUserName } from "@/entities/user";
import type { User } from "@/shared/types/user";

interface UserNameEditProps {
  user: User;
  /** Показывать скелетон вместо контента */
  loading?: boolean;
}

/**
 * Инлайн-редактор имени пользователя.
 * При клике на текущее значение отображает поле ввода.
 */
export default function UserNameEdit({
  user,
  loading = false,
}: UserNameEditProps) {
  const updateName = useUpdateUserName();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState<string | null>(user.name);

  React.useEffect(() => {
    setValue(user.name);
  }, [user.name]);

  const save = () => {
    updateName.mutate(
      { id: user.id, name: value },
      { onSettled: () => setEditing(false) },
    );
  };

  if (loading) {
    return <Skeleton.Input active size="small" style={{ width: 120 }} />;
  }

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
        {user.name ?? "—"}
      </div>
    );
  }

  return (
    <Input
      size="small"
      autoFocus
      value={value ?? ""}
      onChange={(e) => setValue(e.target.value)}
      onPressEnter={save}
      onBlur={save}
      disabled={updateName.isPending}
    />
  );
}
