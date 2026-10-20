/*
  Warnings:

  - Added the required column `userId` to the `Phrase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Phrase` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Phrase_userId_createdAt_idx` ON `Phrase`(`userId`, `createdAt` DESC);

-- AddForeignKey
ALTER TABLE `Phrase` ADD CONSTRAINT `Phrase_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
