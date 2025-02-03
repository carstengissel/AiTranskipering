import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, format } from 'date-fns';
import { da } from 'date-fns/locale';

const getStartOfPeriod = (date, scale) => {
  const dateObj = new Date(date);
  switch (scale) {
    case 'days':
      return startOfDay(dateObj);
    case 'weeks':
      return startOfWeek(dateObj, { weekStartsOn: 1 }); // Week starts on Monday
    case 'months':
      return startOfMonth(dateObj);
    case 'quarters':
      return startOfQuarter(dateObj);
    case 'years':
      return startOfYear(dateObj);
    default:
      return startOfWeek(dateObj, { weekStartsOn: 1 });
  }
};

const formatPeriod = (date, scale) => {
  const dateObj = new Date(date);
  switch (scale) {
    case 'days':
      return format(dateObj, 'd MMM yyyy', { locale: da });
    case 'weeks':
      return `Uge ${format(dateObj, 'w yyyy', { locale: da })}`;
    case 'months':
      return format(dateObj, 'MMM yyyy', { locale: da });
    case 'quarters':
      return `Q${Math.floor(dateObj.getMonth() / 3) + 1} ${dateObj.getFullYear()}`;
    case 'years':
      return format(dateObj, 'yyyy', { locale: da });
    default:
      return format(dateObj, 'w', { locale: da });
  }
};

export const groupDataByTimeScale = (data, scale = 'weeks', dateAccessor = 'date') => {
  const groupedData = data.reduce((acc, item) => {
    const date = getStartOfPeriod(item[dateAccessor], scale);
    const key = date.toISOString();
    
    if (!acc[key]) {
      acc[key] = {
        date: date,
        displayDate: formatPeriod(date, scale),
        items: []
      };
    }
    
    acc[key].items.push(item);
    return acc;
  }, {});

  return Object.values(groupedData)
    .sort((a, b) => a.date - b.date)
    .map(group => ({
      ...group,
      ...aggregateGroupData(group.items)
    }));
};

const aggregateGroupData = (items) => {
  return items.reduce((acc, item) => {
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'number' && key !== 'date') {
        if (!acc[key]) acc[key] = 0;
        acc[key] += item[key];
      }
    });
    return acc;
  }, {});
};
