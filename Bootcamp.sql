-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema volunteer_system
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema volunteer_system
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `volunteer_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
USE `volunteer_system` ;

-- -----------------------------------------------------
-- Table `volunteer_system`.`faculties`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`faculties` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name` (`name` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 18
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `volunteer_system`.`majors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`majors` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` INT(11) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `faculty_id` (`faculty_id` ASC) VISIBLE,
  CONSTRAINT `majors_ibfk_1`
    FOREIGN KEY (`faculty_id`)
    REFERENCES `volunteer_system`.`faculties` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 60
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `volunteer_system`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `student_id` VARCHAR(8) NULL DEFAULT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('STUDENT', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
  `is_banned` TINYINT(1) NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `faculty_id` INT(11) NULL DEFAULT NULL,
  `major_id` INT(11) NULL DEFAULT NULL,
  `profile_image` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `student_id` (`student_id` ASC) VISIBLE,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE,
  INDEX `faculty_id` (`faculty_id` ASC) VISIBLE,
  INDEX `major_id` (`major_id` ASC) VISIBLE,
  CONSTRAINT `users_ibfk_1`
    FOREIGN KEY (`faculty_id`)
    REFERENCES `volunteer_system`.`faculties` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_2`
    FOREIGN KEY (`major_id`)
    REFERENCES `volunteer_system`.`majors` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `volunteer_system`.`activity_categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`activity_categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name` (`name` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `volunteer_system`.`activities`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`activities` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `category` ENUM('อาสา', 'ช่วยงาน', 'อบรม') NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `max_participants` INT(11) NOT NULL,
  `status` ENUM('รออนุมัติ', 'อนุมัติ', 'ปฏิเสธ', 'เสร็จสิ้น', 'ยกเลิก') NULL DEFAULT 'รออนุมัติ',
  `created_by` INT(11) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `cover_image` VARCHAR(255) NULL DEFAULT NULL,
  `category_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `created_by` (`created_by` ASC) VISIBLE,
  INDEX `category_id` (`category_id` ASC) VISIBLE,
  CONSTRAINT `activities_ibfk_1`
    FOREIGN KEY (`created_by`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `activities_ibfk_2`
    FOREIGN KEY (`category_id`)
    REFERENCES `volunteer_system`.`activity_categories` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `volunteer_system`.`activity_applications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`activity_applications` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `activity_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `status` ENUM('รอดำเนินการ', 'อนุมัติ', 'ปฏิเสธ') NULL DEFAULT 'รอดำเนินการ',
  `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `approved_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `activity_user` (`activity_id` ASC, `user_id` ASC) VISIBLE,
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `approved_by` (`approved_by` ASC) VISIBLE,
  CONSTRAINT `activity_applications_ibfk_1`
    FOREIGN KEY (`activity_id`)
    REFERENCES `volunteer_system`.`activities` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `activity_applications_ibfk_2`
    FOREIGN KEY (`user_id`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `activity_applications_ibfk_3`
    FOREIGN KEY (`approved_by`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `volunteer_system`.`activity_participation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`activity_participation` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `activity_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `hours` DECIMAL(5,2) NULL DEFAULT 0.00,
  `points` DECIMAL(5,2) NULL DEFAULT 0.00,
  `verified_by` INT(11) NULL DEFAULT NULL,
  `verified_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `activity_user` (`activity_id` ASC, `user_id` ASC) VISIBLE,
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `verified_by` (`verified_by` ASC) VISIBLE,
  CONSTRAINT `activity_participation_ibfk_1`
    FOREIGN KEY (`activity_id`)
    REFERENCES `volunteer_system`.`activities` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `activity_participation_ibfk_2`
    FOREIGN KEY (`user_id`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `activity_participation_ibfk_3`
    FOREIGN KEY (`verified_by`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `volunteer_system`.`user_roles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`user_roles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `role` ENUM('STUDENT', 'STAFF', 'ADMIN') NOT NULL,
  `granted_by` INT(11) NULL DEFAULT NULL,
  `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `granted_by` (`granted_by` ASC) VISIBLE,
  CONSTRAINT `user_roles_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2`
    FOREIGN KEY (`granted_by`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
