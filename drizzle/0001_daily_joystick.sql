CREATE TABLE "todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"label" text NOT NULL,
	"status" text NOT NULL,
	"priority" text NOT NULL
);
