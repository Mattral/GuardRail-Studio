import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, timeout: 60000 });

export const getHealth = () => client.get("/health").then((r) => r.data);

export const getUpstream = () => client.get("/upstream").then((r) => r.data);
export const putUpstream = (mode) => client.put("/upstream", { mode }).then((r) => r.data);

export const getPolicy = () => client.get("/policy").then((r) => r.data);
export const putPolicy = (policy) => client.put("/policy", policy).then((r) => r.data);
export const getPolicyHistory = (limit = 20) =>
  client.get("/policy/history", { params: { limit } }).then((r) => r.data);

export const getAuditLog = ({ decision, search, skip = 0, limit = 20 } = {}) =>
  client.get("/audit-log", { params: { decision, search, skip, limit } }).then((r) => r.data);
export const getAuditLogRecent = (limit = 20) =>
  client.get("/audit-log/recent", { params: { limit } }).then((r) => r.data);
export const getAuditLogDetail = (requestId) =>
  client.get(`/audit-log/${requestId}`).then((r) => r.data);

export const getMetrics = () => client.get("/metrics").then((r) => r.data);

export const postTestPrompt = ({ content, role = "user", upstream = "mock" }) =>
  client.post("/test-prompt", { content, role, upstream }).then((r) => r.data);

export default client;
