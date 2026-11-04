-- Speed up delivery partner "my delivered orders" list

CREATE INDEX idx_orders_agent_delivered
  ON orders (assigned_agent_id, status, delivered_at DESC);
