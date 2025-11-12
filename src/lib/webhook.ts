interface WebhookPayload {
  event: string;
  timestamp: string;
  user_id: string;
  data: any;
}

export class WebhookService {
  private static webhookUrl: string | null = null;

  static initialize() {
    this.webhookUrl = import.meta.env.VITE_WEBHOOK_URL || null;
  }

  static async sendWebhook(event: string, data: any, userId: string): Promise<boolean> {
    if (!this.webhookUrl) {
      console.log('Webhook URL not configured, skipping webhook send');
      return false;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      user_id: userId,
      data
    };

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EchoCare-Webhook/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Webhook failed:', response.status, response.statusText);
        return false;
      }

      console.log('Webhook sent successfully:', event);
      return true;
    } catch (error) {
      console.error('Webhook error:', error);
      return false;
    }
  }

  // Specific webhook methods for different events
  static async sendPatientCreated(patient: any, userId: string) {
    return this.sendWebhook('patient.created', patient, userId);
  }

  static async sendPatientUpdated(patient: any, userId: string) {
    return this.sendWebhook('patient.updated', patient, userId);
  }

  static async sendPatientDeleted(patientId: string, userId: string) {
    return this.sendWebhook('patient.deleted', { patient_id: patientId }, userId);
  }

  static async sendMedicationCreated(medication: any, userId: string) {
    return this.sendWebhook('medication.created', medication, userId);
  }

  static async sendReminderCreated(reminder: any, userId: string) {
    return this.sendWebhook('reminder.created', reminder, userId);
  }

  static async sendAppointmentCreated(appointment: any, userId: string) {
    return this.sendWebhook('appointment.created', appointment, userId);
  }
}

// Initialize webhook service
WebhookService.initialize();