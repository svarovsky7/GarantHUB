/**
 * Интерфейс управления формой редактирования претензии.
 */
export interface ClaimFormAntdEditRef {
  /** Отправить форму */
  submit: () => void;
  /** Идет ли отправка формы */
  isSubmitting: boolean;
}
