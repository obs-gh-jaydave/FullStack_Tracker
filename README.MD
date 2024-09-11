# FullStack Tracer with OpenTelemetry and Grafana Faro

## Introduction

**FullStack Tracer** is a web application designed to provide end-to-end observability using **OpenTelemetry** for backend tracing and **Grafana Faro** for frontend instrumentation. This solution helps monitor user interactions, capture backend logs, track Core Web Vitals, and observe system performance metrics such as CPU and memory usage. This README guides you through setting up the project, sending telemetry data to **Observe**, and configuring the OpenTelemetry Collector to capture and forward data from both the frontend and backend.

## Key Features

1. **End-to-End Tracing**: Seamlessly links frontend and backend traces, enabling complete visibility into user interactions and server processes.
   
2. **Browser Log Aggregation**: Aggregates browser console logs (such as error logs) for querying and analysis.

3. **System Metrics Observation**: Tracks CPU usage, memory consumption, and response status codes for specific services.

4. **Core Web Vitals (CWV)**: Monitors important browser performance metrics like FID (First Input Delay), LCP (Largest Contentful Paint), and CLS (Cumulative Layout Shift).

5. **Network Activity Monitoring**: Observes network requests and tracks which resources are consuming the most bandwidth on the client side.

## Project Structure

- **frontend/**: Contains the React application instrumented with **Grafana Faro**.
  
- **backend/**: Contains the Express.js backend instrumented with **OpenTelemetry**.

- **otel-collector-config.yaml**: Configuration file for the OpenTelemetry Collector to export data to **Observe**.

- **docker-compose.yaml**: Docker Compose setup to orchestrate frontend, backend, and OpenTelemetry Collector services.

## Prerequisites

Ensure you have the following installed:
- **Docker** and **Docker Compose**
- **Node.js** and **npm**

## Installation and Setup

### 1. Clone the repository:
```bash
git clone https://github.com/yourusername/fullstack-tracer.git
cd fullstack-tracer
```

### 2. Install dependencies:
For the frontend:
```bash
cd frontend
npm install
```
For the backend:
```bash
cd ../backend
npm install
```

### 3. Update Configuration to Send Telemetry to Observe

#### Update OpenTelemetry Collector Configuration
*NOTE: For the `frontend/src/index.js` you MUST supply a Bearer Token that is type HTTP & for `otel-collector-config.yaml` provide an OTLP Bearer Token*

In `otel-collector-config.yaml`, update the **Observe** OTLP endpoint and authentication values:
```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: "0.0.0.0:4318"
        cors:
          allowed_origins:
            - http://localhost:3000  # Allow requests from your front-end
          allowed_headers:
            - "*"
      grpc:
        endpoint: "0.0.0.0:4317"

processors:
  batch:

exporters:
  otlphttp:
    endpoint: "https://<OBSERVE_CUSTOMER_ID>.collect.observeinc.com/v2/otel"
    headers:
      authorization: "Bearer <OBSERVE_API_TOKEN>"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp]
```
Replace `<OBSERVE_CUSTOMER_ID>` with your **Observe** customer ID and `<OBSERVE_API_TOKEN>` with the API token from **Observe**.

#### Update Frontend Configuration
In `frontend/src/index.js`, update the Grafana Faro configuration to send telemetry to Observe:
```js
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';
import { FetchTransport } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export const faroInstance = initializeFaro({
  app: {
    name: 'FrontendApp',
    version: '1.0.0',
  },
  batching: {
    enabled: true,
    limit: 100,  // Adjust batching as needed
    interval: 300000,  // Set batching interval to 5 minutes
  },
  sessionTracking: {
    enabled: true,  
  },
  instrumentations: [
    ...getWebInstrumentations({
      enablePerformanceInstrumentation: false,  // Disable non-essential performance tracking
    }),
    new TracingInstrumentation({ propagateTraceContext: true }),  // Enable tracing instrumentation
  ],
  transports: [
    new FetchTransport({
      url: 'https://<OBSERVE_CUSTOMER_ID>.collect.observeinc.com/v1/http?source=faro',
      requestOptions: {
        headers: {
          'Authorization': 'Bearer <OBSERVE_API_TOKEN>',
        },
      },
      beforeSend: (events) => {
        return events.filter(event => ['log', 'error', 'trace'].includes(event.domain));
      },
      onError: (error) => {
        console.error('Error sending traces:', error);
      },
    }),
  ],
});
```
Replace `<OBSERVE_CUSTOMER_ID>` and `<OBSERVE_API_TOKEN>` with your **Observe** credentials.

### 4. Build and Run the Docker Containers:
```bash
docker-compose up --build
```

### 5. Access the application:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:3001](http://localhost:3001/api/data)

## Observability Pipeline

### Frontend Tracing with Grafana Faro
The **frontend** captures user interactions, Core Web Vitals, and network activities using **Grafana Faro**. The data is sent to **Observe** using a FetchTransport, and traces are linked using the `traceparent` header.

### Backend Tracing with OpenTelemetry
The **backend** uses **OpenTelemetry** to automatically instrument incoming HTTP requests. Backend traces are linked to frontend spans using the `traceparent` header, allowing for end-to-end visibility across user interactions and server-side processes.

### OpenTelemetry Collector
The **OpenTelemetry Collector** receives traces via HTTP and gRPC, processes them (e.g., batching), and exports them to **Observe**.

## Functional Requirements Addressed

1. **End-to-End User Experience**: This setup links frontend and backend traces to provide full visibility into user interactions and backend processing.

2. **Browser Log Aggregation**: Browser logs (console errors, warnings) are aggregated and sent to Observe for querying.

3. **System Metrics Observation**: System metrics such as CPU usage and memory consumption are captured and sent to Observe.

4. **Core Web Vitals Tracking**: Tracks key web performance metrics (CWV) such as FID, LCP, and CLS to assess browser performance.

5. **Network Activity Monitoring**: Captures and tracks browser network requests to analyze client-side resource consumption.

## Advanced Features

- **Synthetic Testing**: In the future, synthetic testing can be added to simulate different user interactions.
- **Advanced Sampling**: Sampling can be adjusted to reduce the noise while maintaining data quality.
- **Custom Metrics**: You can push additional custom system-level metrics (e.g., memory and CPU usage) from the backend.

## Conclusion

This project demonstrates how to use **OpenTelemetry** and **Grafana Faro** to build an **end-to-end observability solution**. With frontend and backend traces, system metrics, and Core Web Vitals tracking, this setup enables complete visibility into user interactions and backend processing, providing the tools needed to monitor and improve application performance.