db.createUser({
    user: "root",
    pwd: "rootpassword",
    roles: [
      { role: "readWrite", db: "tienda" }
    ]
  });
  
  db = db.getSiblingDB("tienda");
  db.createCollection("pedidos");
  