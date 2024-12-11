db.createUser({
    user: "root",
    pwd: "rootpassword",
    roles: [
      { role: "readWrite", db: "tienda" }
    ]
  });
  
  db = db.getSiblingDB("tienda"); // Cambia a la base de datos "tienda"
  db.createCollection("pedidos");
  