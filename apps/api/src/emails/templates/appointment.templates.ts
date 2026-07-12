type AppointmentEmailData = {
  firstname: string;
  animalName: string;
  date: Date;
  startTime: Date;
};

function formatDateTime(date: Date, startTime: Date) {
  const dateLabel = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = startTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { dateLabel, timeLabel };
}

function appointmentCard(dateLabel: string, timeLabel: string) {
  return `
    <div style="padding: 16px; background: #f4f4f4; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; font-weight: bold;">${dateLabel}</p>
      <p style="margin: 4px 0 0;">${timeLabel}</p>
    </div>
  `;
}

export const appointmentTemplates = {
  created: (data: AppointmentEmailData) => {
    const { dateLabel, timeLabel } = formatDateTime(data.date, data.startTime);
    return {
      subject: "Votre rendez-vous est confirmé",
      titleColor: "#256cab",
      title: "Rendez-vous confirmé",
      body: `
        <p>Bonjour ${data.firstname},</p>
        <p>Le rendez-vous pour <strong>${data.animalName}</strong> a bien été enregistré.</p>
        ${appointmentCard(dateLabel, timeLabel)}
      `,
    };
  },

  rescheduled: (data: AppointmentEmailData) => {
    const { dateLabel, timeLabel } = formatDateTime(data.date, data.startTime);
    return {
      subject: "Votre rendez-vous a été modifié",
      titleColor: "#256cab",
      title: "Rendez-vous modifié",
      body: `
        <p>Bonjour ${data.firstname},</p>
        <p>Le rendez-vous pour <strong>${data.animalName}</strong> a été déplacé.</p>
        ${appointmentCard(dateLabel, timeLabel)}
        <p style="color: #888; font-size: 13px;">Si ce changement pose problème, contactez votre clinique pour reprogrammer.</p>
      `,
    };
  },

  updatedConfirmation: (data: AppointmentEmailData) => {
    const { dateLabel, timeLabel } = formatDateTime(data.date, data.startTime);
    return {
      subject: "Votre rendez-vous a bien été modifié",
      titleColor: "#256cab",
      title: "Modification confirmée",
      body: `
        <p>Bonjour ${data.firstname},</p>
        <p>Le rendez-vous pour <strong>${data.animalName}</strong> a bien été mis à jour.</p>
        ${appointmentCard(dateLabel, timeLabel)}
      `,
    };
  },

  reminder: (data: AppointmentEmailData) => {
    const { dateLabel, timeLabel } = formatDateTime(data.date, data.startTime);
    return {
      subject: "Rappel : rendez-vous demain",
      titleColor: "#256cab",
      title: "Rappel de rendez-vous",
      body: `
        <p>Bonjour ${data.firstname},</p>
        <p>Petit rappel : le rendez-vous pour <strong>${data.animalName}</strong> a lieu demain.</p>
        ${appointmentCard(dateLabel, timeLabel)}
      `,
    };
  },

  cancelled: (data: AppointmentEmailData) => {
    const { dateLabel, timeLabel } = formatDateTime(data.date, data.startTime);
    return {
      subject: "Votre rendez-vous a été annulé",
      titleColor: "#e74c3c",
      title: "Rendez-vous annulé",
      body: `
        <p>Bonjour ${data.firstname},</p>
        <p>Le rendez-vous pour <strong>${data.animalName}</strong> prévu le :</p>
        ${appointmentCard(dateLabel, timeLabel)}
        <p>a été annulé.</p>
        <p style="color: #888; font-size: 13px;">Contactez votre clinique pour reprogrammer un nouveau créneau.</p>
      `,
    };
  },
};

export type AppointmentEmailType = keyof typeof appointmentTemplates;
