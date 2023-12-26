const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//1.Get todos
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}';`;
      break;

    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT 
                * 
            FROM 
                todo
            WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE 
                todo LIKE '%${search_q}%' AND priority = '${priority}';`;
      break;
    default:
      getTodoQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

//2.Get todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
    SELECT * FROM todo WHERE id = ${todoId}`;
  const result = await db.get(getTodo);
  response.send(result);
});

//3.Post todo
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const insertTodoQuery = `
    INSERT INTO
        todo(id,todo,priority,status)
    VALUES(
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );`;
  await db.run(insertTodoQuery);
  response.send("Todo Successfully Added");
});

//4.Update todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "To do";
      break;
  }

  const previousDataQuery = `
  SELECT 
    *
  FROM
    todo
  WHERE id = ${todoId};`;
  const previousData = await db.get(previousDataQuery);

  const {
    todo = previousData.todo,
    status = previousData.status,
    priority = previousData.priority,
  } = request.body;
  try {
    const updateDataQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE
    id = ${todoId};`;
    const result = await db.run(updateDataQuery);
    response.send(`${updateColumn} Updated`);
  } catch (e) {
    response.send(`${e.message}`);
  }
});

//5.Delete Todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const removeTodoQuery = `
    DELETE FROM 
        todo
    WHERE
        id = ${todoId};`;
  await db.run(removeTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
