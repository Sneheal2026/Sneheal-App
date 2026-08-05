-- Extra indexes for catalog search / filtering at scale (5k+ products)

CREATE INDEX idx_products_brand ON products (brand_name);
CREATE INDEX idx_products_generic ON products (generic_name);
CREATE INDEX idx_products_manufacturer ON products (manufacturer);
