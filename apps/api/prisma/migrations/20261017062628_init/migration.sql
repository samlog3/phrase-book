-- CreateTable
CREATE TABLE `Phrase` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phrase` VARCHAR(255) NOT NULL,
    `meaning` VARCHAR(500) NOT NULL,
    `example` TEXT NULL,
    `context` TEXT NULL,
    `note` TEXT NULL,
    `source` VARCHAR(255) NULL,
    `sourceUrl` VARCHAR(2048) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Phrase_isPublic_createdAt_idx`(`isPublic`, `createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
