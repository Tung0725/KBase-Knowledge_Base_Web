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

    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws-kbase', // Assuming backend is on port 8080
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Connected to KBase WebSocket');
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
        const data = JSON.parse(message.body);
        console.log('Received real-time update:', data);
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
