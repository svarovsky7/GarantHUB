import React from 'react';
import ProjectForm from '../project/ProjectForm';

/** Обёртка с нужной подписью поля */
const TicketTypeForm = (props) => (
    <ProjectForm label="Название типа" {...props} />      // CHANGE
);

export default TicketTypeForm;
