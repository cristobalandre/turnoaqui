import { isBefore, startOfMinute } from "date-fns";

export const isPastDateTime = (date: Date | string): boolean => {
  const selectedDate = new Date(date);
  const now = startOfMinute(new Date()); 
  return isBefore(selectedDate, now);
};

export const DATE_ERROR_MSG = "Operación denegada: No puedes agendar en el pasado.";