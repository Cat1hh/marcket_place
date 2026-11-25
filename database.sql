CREATE DATABASE IF NOT EXISTS nexatech
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nexatech;

CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  categoria VARCHAR(60) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  preco_antigo DECIMAL(10, 2) NULL,
  estoque INT NOT NULL DEFAULT 0,
  status ENUM('Ativo', 'Rascunho') NOT NULL DEFAULT 'Ativo',
  imagem VARCHAR(255) NULL,
  destaque VARCHAR(80) NULL,
  descricao TEXT NULL,
  avaliacao DECIMAL(2, 1) NOT NULL DEFAULT 5.0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO produtos (nome, categoria, preco, preco_antigo, estoque, status, imagem, destaque, descricao, avaliacao) VALUES
('Teclado Mecânico Nexa K1', 'Teclados', 349.90, 419.90, 15, 'Ativo', '', 'Switch Tactile', 'Teclado mecânico compacto 75% com switches táteis lubrificados de fábrica e iluminação branca.', 4.9),
('Mouse Wireless Pro X', 'Mouses', 229.90, 279.90, 22, 'Ativo', '', '26.000 DPI', 'Mouse ultraleve de 58g com sensor óptico de alta precisão e conexão sem fio de baixa latência.', 4.8),
('Headset Studio ANC', 'Áudio', 419.00, NULL, 8, 'Ativo', '', 'Cancelamento de Ruído', 'Drivers de 50mm com cancelamento ativo de ruído e almofadas em espuma de memória.', 4.7),
('Monitor UltraWide 29" IPS', 'Monitores', 1299.00, 1499.00, 5, 'Ativo', '', '100Hz • sRGB 99%', 'Tela IPS 21:9 ideal para produtividade, edição e setups minimalistas.', 4.9);