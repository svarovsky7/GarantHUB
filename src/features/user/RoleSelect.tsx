import React from "react";
import { FormControl, Select, MenuItem, CircularProgress } from "@mui/material";
import { useUpdateUserRole } from "../../entities/user";

const RoleSelect = ({ user, roles }) => {
  const updateRole = useUpdateUserRole();

  const handleChange = (e) =>
    updateRole.mutate({ id: user.id, newRole: e.target.value });

  return (
    <FormControl size="small" sx={{ minWidth: 140 }} data-oid="7n8rphk">
      {updateRole.isLoading && (
        <CircularProgress
          size={18}
          sx={{ position: "absolute", right: 8, top: 8 }}
          data-oid="g032te3"
        />
      )}
      <Select
        value={user.role}
        onChange={handleChange}
        disabled={updateRole.isLoading}
        data-oid="ri0--oc"
      >
        {roles.map((r) => (
          <MenuItem key={r.name} value={r.name} data-oid="8xkkc9l">
            {r.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default RoleSelect;
