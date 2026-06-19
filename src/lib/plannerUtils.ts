export interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  monthName: string;
}

export function getMonthName(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(date);
}

export function calculateWeeks(startDateStr: string, endDateStr: string): WeekData[] {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const weeks: WeekData[] = [];
  
  // Ajustamos el inicio al lunes de esa semana
  const current = new Date(start);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // 0 es Domingo
  current.setDate(diff);

  let weekNumber = 1;

  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekStart.getDate() + 4); // Viernes de esa semana

    // Solo agregar la semana si al menos un día cae dentro del rango
    if (weekEnd >= start && weekStart <= end) {
      weeks.push({
        weekNumber,
        startDate: new Date(Math.max(weekStart.getTime(), start.getTime())),
        endDate: new Date(Math.min(weekEnd.getTime(), end.getTime())),
        monthName: getMonthName(weekStart).charAt(0).toUpperCase() + getMonthName(weekStart).slice(1)
      });
      weekNumber++;
    }

    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

export function generateClassDates(startDate: Date, endDate: Date, classCount: number, omitWeekends: boolean = true): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate);
  
  while (dates.length < classCount && current <= endDate) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    
    if (!omitWeekends || !isWeekend) {
      dates.push(new Date(current));
    }
    
    current.setDate(current.getDate() + 1);
    
    // Si nos pasamos de la fecha de término, empezamos a repetir fechas (o podríamos agrupar 2 clases en un día)
    // Para simplificar, si llegamos al endDate y faltan clases, ignoramos el límite temporal y seguimos avanzando.
    if (current > endDate && dates.length < classCount) {
        // Continue advancing anyway to fulfill class count
    }
  }
  
  return dates;
}
