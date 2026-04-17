/*
  Warnings:

  - You are about to drop the column `rol` on the `project_users` table. All the data in the column will be lost.
  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `evidences_projectPhaseId_fkey` ON `evidences`;

-- DropIndex
DROP INDEX `evidences_userId_fkey` ON `evidences`;

-- DropIndex
DROP INDEX `phase_checklist_projectPhaseId_fkey` ON `phase_checklist`;

-- DropIndex
DROP INDEX `project_phases_phaseId_fkey` ON `project_phases`;

-- DropIndex
DROP INDEX `project_users_userId_fkey` ON `project_users`;

-- DropIndex
DROP INDEX `projects_companyId_fkey` ON `projects`;

-- DropIndex
DROP INDEX `summary_checklist_projectId_fkey` ON `summary_checklist`;

-- AlterTable
ALTER TABLE `project_users` DROP COLUMN `rol`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `role` ENUM('DOCENTE', 'EVALUADOR', 'COORDINADOR', 'ESTUDIANTE') NOT NULL;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_users` ADD CONSTRAINT `project_users_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_users` ADD CONSTRAINT `project_users_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_phases` ADD CONSTRAINT `project_phases_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_phases` ADD CONSTRAINT `project_phases_phaseId_fkey` FOREIGN KEY (`phaseId`) REFERENCES `phases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidences` ADD CONSTRAINT `evidences_projectPhaseId_fkey` FOREIGN KEY (`projectPhaseId`) REFERENCES `project_phases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidences` ADD CONSTRAINT `evidences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phase_checklist` ADD CONSTRAINT `phase_checklist_projectPhaseId_fkey` FOREIGN KEY (`projectPhaseId`) REFERENCES `project_phases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `summary_checklist` ADD CONSTRAINT `summary_checklist_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_validation` ADD CONSTRAINT `business_validation_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
