CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  categoria VARCHAR(60) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL,
  preco_antigo NUMERIC(10, 2) NULL,
  estoque INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Rascunho')),
  imagem VARCHAR(255) NULL,
  destaque VARCHAR(80) NULL,
  descricao TEXT NULL,
  avaliacao NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE,
  endereco VARCHAR(255) NOT NULL,
  cep VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  endereco_entrega VARCHAR(255) NOT NULL,
  cep_entrega VARCHAR(20) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  frete NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Recebido'
    CHECK (status IN ('Recebido', 'Em separação', 'Enviado', 'Entregue')),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INT NULL REFERENCES produtos(id) ON DELETE SET NULL,
  nome_produto VARCHAR(150) NOT NULL,
  quantidade INT NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10, 2) NOT NULL
);

-- Insere os produtos iniciais apenas se a tabela ainda estiver vazia
INSERT INTO produtos (nome, categoria, preco, preco_antigo, estoque, status, imagem, destaque, descricao, avaliacao)
SELECT * FROM (
  VALUES
    ('Teclado Mecânico Nexa K1', 'Teclados', 349.90, 419.90, 15, 'Ativo', '', 'Switch Tactile', 'Teclado mecânico compacto 75% com switches táteis lubrificados de fábrica e iluminação branca.', 4.9),
    ('Mouse Wireless Pro X', 'Mouses', 229.90, 279.90, 22, 'Ativo', '', '26.000 DPI', 'Mouse ultraleve de 58g com sensor óptico de alta precisão e conexão sem fio de baixa latência.', 4.8),
    ('Headset Studio ANC', 'Áudio', 419.00, NULL, 8, 'Ativo', '', 'Cancelamento de Ruído', 'Drivers de 50mm com cancelamento ativo de ruído e almofadas em espuma de memória.', 4.7),
    ('Monitor UltraWide 29" IPS', 'Monitores', 1299.00, 1499.00, 5, 'Ativo', '', '100Hz • sRGB 99%', 'Tela IPS 21:9 ideal para produtividade, edição e setups minimalistas.', 4.9)
) AS iniciais(nome, categoria, preco, preco_antigo, estoque, status, imagem, destaque, descricao, avaliacao)
WHERE NOT EXISTS (SELECT 1 FROM produtos);
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'cliente')),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cupom VARCHAR(40) DEFAULT NULL;