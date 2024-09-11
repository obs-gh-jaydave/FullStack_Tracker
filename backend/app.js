const express = require('express');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { trace, context, propagation } = require('@opentelemetry/api');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const cors = require('cors'); // Enable CORS

// Set up OpenTelemetry for the backend
const provider = new NodeTracerProvider({
  resource: new Resource({
    'service.name': 'backend-service',
  }),
});

// Set up the OTLP HTTP trace exporter (to send traces to the collector)
const traceExporter = new OTLPTraceExporter({
  url: 'http://collector:4318/v1/traces',
});
provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));  // Use BatchSpanProcessor for production
provider.register();

// Initialize the tracer
const tracer = trace.getTracer('backend-service');

// Automatically instrument HTTP requests
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation()
  ],
  tracerProvider: provider,
});

const app = express();
app.use(cors()); // Enable CORS for front-end requests

let count = 0; // Initialize a count variable

// Handle the /api/data request and propagate trace context
app.get('/api/data', (req, res) => {
  // Extract trace context from incoming headers
  const extractedContext = propagation.extract(context.active(), req.headers);

  // Start a new span, continuing the trace from the frontend
  const span = tracer.startSpan('handle-api-data', {
    attributes: { 'http.method': 'GET', 'http.route': '/api/data' }
  }, extractedContext);

   // Log span details 
   const spanContext = span.spanContext();
   console.log('Span Attributes:', {
     traceId: spanContext.traceId,
     spanId: spanContext.spanId,
     traceFlags: spanContext.traceFlags,
     kind: span.kind,
     name: span.name,
     attributes: span.attributes,
     events: span.events,
     startTime: span.startTime,
     duration: span.duration,
     resource: span.resource,
   });

  count += 1;

  // Send JSON response
  res.json({ message: 'Hello from the backend!', count: count });

  // End the span after response is sent
  span.end();
  // Log end of span
  console.log('Span ended:', {
    endTime: span.endTime,
    _ended: span._ended,
    duration: span.duration,
  });
});

// Start the server
app.listen(3001, () => {
  console.log('Backend listening on port 3001');
});