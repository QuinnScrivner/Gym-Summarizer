import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db.js';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

// Simple API key auth
app.use((req, res, next) => {
  const key = req.header('x-api-key');
  if (process.env.API_KEY && key !== process.env.API_KEY) return res.status(401).json({error:'Unauthorized'});
  next();
});

/* === Helpers === */
const isoDate = (d=new Date()) => new Date(d).toISOString();

/* === Exercises === */
app.get('/exercises', (req,res)=> {
  const rows = db.prepare('SELECT * FROM exercises ORDER BY name').all();
  res.json(rows);
});
app.post('/exercises', (req,res)=>{
  const schema = z.object({ name: z.string().min(1), body_part: z.string().optional() });
  const { name, body_part } = schema.parse(req.body);
  const stmt = db.prepare('INSERT INTO exercises (name, body_part) VALUES (?, ?)');
  const info = stmt.run(name, body_part ?? null);
  res.json({ id: info.lastInsertRowid, name, body_part });
});

/* === Workouts & Sets === */
app.post('/workouts', (req,res)=>{
  const schema = z.object({ date: z.string().optional(), notes: z.string().optional() });
  const { date, notes } = schema.parse(req.body);
  const info = db.prepare('INSERT INTO workouts (date, notes) VALUES (?, ?)').run(date ?? isoDate(), notes ?? null);
  res.json({ id: info.lastInsertRowid });
});

app.post('/sets', (req,res)=>{
  const schema = z.object({
    workout_id: z.number().int(),
    exercise: z.string().min(1),
    weight: z.number(),
    reps: z.number().int().positive(),
    rpe: z.number().optional()
  });
  const { workout_id, exercise, weight, reps, rpe } = schema.parse(req.body);
  // upsert exercise
  let ex = db.prepare('SELECT id FROM exercises WHERE name = ?').get(exercise);
  if (!ex) {
    const info = db.prepare('INSERT INTO exercises (name) VALUES (?)').run(exercise);
    ex = { id: info.lastInsertRowid };
  }
  const info = db.prepare(
    'INSERT INTO sets (workout_id, exercise_id, weight, reps, rpe) VALUES (?, ?, ?, ?, ?)'
  ).run(workout_id, ex.id, weight, reps, rpe ?? null);
  res.json({ id: info.lastInsertRowid });
});

/* === Body weight & nutrition === */
app.post('/bodyweight', (req,res)=>{
  const s = z.object({ date: z.string(), weight: z.number() });
  const { date, weight } = s.parse(req.body);
  const up = db.prepare('INSERT INTO body_weight_logs (date, weight) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET weight=excluded.weight');
  up.run(date, weight);
  res.json({ ok: true });
});

app.post('/nutrition', (req,res)=>{
  const s = z.object({ date: z.string(), calories: z.number().int().optional(), protein: z.number().optional(), carbs: z.number().optional(), fat: z.number().optional() });
  const x = s.parse(req.body);
  const up = db.prepare(`
    INSERT INTO nutrition_logs (date, calories, protein, carbs, fat)
    VALUES (@date, @calories, @protein, @carbs, @fat)
    ON CONFLICT(date) DO UPDATE SET
      calories=excluded.calories, protein=excluded.protein, carbs=excluded.carbs, fat=excluded.fat`);
  up.run(x);
  res.json({ ok: true });
});

/* === Summaries === */
app.get('/summary/week', (req,res)=>{
  // last 7 days volume & est 1RM per exercise (Epley)
  const rows = db.prepare(`
    SELECT e.name AS exercise, date(w.date) AS day,
           SUM(s.weight * s.reps) AS volume,
           MAX(s.weight * (1 + s.reps/30.0)) AS e1rm
    FROM sets s
    JOIN workouts w ON w.id = s.workout_id
    JOIN exercises e ON e.id = s.exercise_id
    WHERE date(w.date) >= date('now','-6 days')
    GROUP BY e.name, date(w.date)
    ORDER BY day, exercise
  `).all();
  res.json(rows);
});

app.get('/summary/prs', (req,res)=>{
  const rows = db.prepare(`
    SELECT e.name AS exercise, MAX(s.weight * (1 + s.reps/30.0)) AS best_e1rm
    FROM sets s JOIN exercises e ON e.id = s.exercise_id
    GROUP BY e.name
    ORDER BY best_e1rm DESC
  `).all();
  res.json(rows);
});

/* === Health === */
app.get('/health', (_,res)=> res.json({ ok: true, time: isoDate() }));

const port = Number(process.env.PORT || 4000);
app.listen(port, ()=> console.log(`API on http://localhost:${port}`));
