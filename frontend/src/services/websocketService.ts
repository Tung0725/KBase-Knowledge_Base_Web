import { Client } from '@stomp/stompjs';

class WebSocketService {
  private client: Client | null = null;
  private currentSubscription: any = null;

  connect(projectId: string, onUpdate: () => void) {
    // If already connected to the same project, don't reconnect
    if (this.client && this.client.active) {
      this.subscribe(projectId, onUpdate);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const wsBase = apiBase.replace(/^http/, 'ws').replace('/api', '');

    this.client = new Client({
      brokerURL: `${wsBase}/ws-kbase`,
      reconnectDelay: 5000,
      onConnect: () => {
        this.subscribe(projectId, onUpdate);
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    this.client.activate();
  }

  private subscribe(projectId: string, onUpdate: () => void) {
    if (!this.client || !this.client.connected) return;

    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
    }

    const topic = `/topic/projects/${projectId}/members`;
    this.currentSubscription = this.client.subscribe(topic, (message) => {
      if (message.body) {
        // Ensure data is parsed correctly if needed, then trigger update
        JSON.parse(message.body);
        onUpdate();
      }
    });
  }

  disconnect() {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
      this.currentSubscription = null;
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}

export const websocketService = new WebSocketService();
