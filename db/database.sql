CREATE DATABASE minapatorns_db;
USE minapatorns_db;


CREATE TABLE contents (
id CHAR(11) NOT NULL PRIMARY KEY,
ic CHAR(255) NOT NULL,
title TEXT NOT NULL,
description TEXT,
price INT(11) NOT NULL,
category VARCHAR(50),
contentPath TEXT,
uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchases (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  user_pk VARCHAR(255) NOT NULL,   
  content_id CHAR(11) NOT NULL,    
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE creators (
  creator_id INT AUTO_INCREMENT PRIMARY KEY,
  privateKey VARCHAR(255) NOT NULL,
  nullifier VARCHAR(255) NOT NULL,
  identityCommitment VARCHAR(255) NOT NULL
);