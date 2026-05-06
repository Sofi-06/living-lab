/*
  Warnings:

  - You are about to drop the column `rol` on the `project_users` table.
  - Added the required column `role` to the `users` table.

*/

-- AlterTable
ALTER TABLE `project_users`
DROP COLUMN `rol`;

-- AlterTable
ALTER TABLE `users`
ADD COLUMN `role`
ENUM('DOCENTE', 'EVALUADOR', 'COORDINADOR', 'ESTUDIANTE')
NULL;