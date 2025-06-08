import React from "react";
import { FormControl, Select, MenuItem, CircularProgress } from "@mui/material";
import { useUpdateUserRole } from "../../entities/user";

const RoleSelect = ({ user, roles }) => {
  const updateRole = useUpdateUserRole();

  const handleChange = (e) =>
    updateRole.mutate({ id: user.id, newRole: e.target.value });

  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      {updateRole.isPending && (
        <CircularProgress
          size={18}
          sx={{ position: "absolute", right: 8, top: 8 }}
        />
      )}
      <Select
        value={user.role}
        onChange={handleChange}
        disabled={updateRole.isPending}
      >
        {roles.map((r) => (
          <MenuItem key={r.name} value={r.name}>
            {r.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default RoleSelect;
