import { useState } from 'react';
import './DatePicker.css';

export default function DatePicker({ availableDates, selectedDate, onDateChange, minDate, centreCapacity }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateAvailable = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const available = availableDates.find(d => d.date === dateStr);
    return available ? available.available : false;
  };

  const getDateInfo = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availableDates.find(d => d.date === dateStr);
  };

  const handleDateClick = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateInfo = getDateInfo(day);
    
    console.log('DatePicker click:', { day, dateStr, dateInfo, available: dateInfo?.available });
    
    if (dateInfo && dateInfo.available) {
      console.log('Date selected:', dateStr);
      onDateChange(dateStr);
    } else {
      console.log('Date not available or no info');
    }
  };

  const isSelected = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="date-picker">
      {(!availableDates || availableDates.length === 0) && (
        <div style={{ padding: '20px', background: '#fee', borderRadius: '8px', color: '#c00', marginBottom: '16px' }}>
          ⚠️ Chargement du calendrier en cours... Si le problème persiste, vérifiez votre connexion.
        </div>
      )}
      
      <div className="calendar-header">
        <button type="button" onClick={prevMonth} className="nav-btn">← Précédent</button>
        <h3>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button type="button" onClick={nextMonth} className="nav-btn">Suivant →</button>
      </div>

      <div className="calendar-grid">
        <div className="weekdays">
          {daysOfWeek.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="dates">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="empty"></div>;
            }

            const dateInfo = getDateInfo(day);
            const available = isDateAvailable(day);
            const selected = isSelected(day);

            return (
              <div
                key={day}
                className={`date ${available ? 'available' : 'unavailable'} ${selected ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
                style={{ 
                  cursor: available ? 'pointer' : 'not-allowed',
                  opacity: available ? 1 : 0.5
                }}
                title={available ? `Cliquer pour sélectionner - ${dateInfo?.free || 0} places libre(s)` : 'Jour non disponible'}
              >
                <div className="day">{day}</div>
                {dateInfo && (
                  <div className="capacity" style={{ fontSize: '11px', marginTop: '4px' }}>
                    {dateInfo.count}/{dateInfo.capacity || centreCapacity}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <span className="legend-item available">Disponible</span>
        <span className="legend-item unavailable">Complète</span>
      </div>
    </div>
  );
}
