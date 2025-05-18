SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema volunteer_system
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `volunteer_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `volunteer_system`;

-- -----------------------------------------------------
-- Table `volunteer_system`.`faculties`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`faculties` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name` (`name` ASC)) -- ลบ VISIBLE ออก
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
  INDEX `faculty_id` (`faculty_id` ASC),
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
  `firstname` VARCHAR(100) NOT NULL,
  `lastname` VARCHAR(100) NOT NULL,
  `role` ENUM('STUDENT', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
  `is_banned` TINYINT(1) NULL DEFAULT 0,
  `ban_count` INT(11) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `faculty_id` INT(11) NULL DEFAULT NULL,
  `major_id` INT(11) NULL DEFAULT NULL,
  `profile_image` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `student_id` (`student_id` ASC),
  UNIQUE INDEX `email` (`email` ASC),
  INDEX `faculty_id` (`faculty_id` ASC),
  INDEX `major_id` (`major_id` ASC),
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
  UNIQUE INDEX `name` (`name` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 11
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
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cover_image` VARCHAR(255) NULL DEFAULT NULL,
  `category_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `created_by` (`created_by` ASC),
  INDEX `category_id` (`category_id` ASC),
  INDEX `idx_activities_status` (`status` ASC),
  INDEX `idx_activities_start_time` (`start_time` ASC),
  INDEX `idx_activities_end_time` (`end_time` ASC),
  CONSTRAINT `activities_ibfk_1`
    FOREIGN KEY (`created_by`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `activities_ibfk_2`
    FOREIGN KEY (`category_id`)
    REFERENCES `volunteer_system`.`activity_categories` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
AUTO_INCREMENT = 6
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
  `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `activity_user` (`activity_id` ASC, `user_id` ASC),
  INDEX `user_id` (`user_id` ASC),
  INDEX `approved_by` (`approved_by` ASC),
  INDEX `idx_activity_applications_status` (`status` ASC),
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
  `hours` DECIMAL(10,2) NULL DEFAULT 0.00, -- ปรับเป็น DECIMAL(10,2) และลบ CHECK
  `points` DECIMAL(5,2) NULL DEFAULT 0.00,
  `verified_by` INT(11) NULL DEFAULT NULL,
  `verified_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `activity_user` (`activity_id` ASC, `user_id` ASC),
  INDEX `user_id` (`user_id` ASC),
  INDEX `verified_by` (`verified_by` ASC),
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
-- Trigger for activity_participation to handle hours rounding
-- -----------------------------------------------------
DELIMITER //

CREATE TRIGGER `before_activity_participation_insert`
BEFORE INSERT ON `volunteer_system`.`activity_participation`
FOR EACH ROW
BEGIN
  DECLARE integer_part DECIMAL(10,0);
  DECLARE decimal_part DECIMAL(10,2);
  
  -- แยกส่วนจำนวนเต็มและส่วนทศนิยม
  SET integer_part = FLOOR(NEW.hours);
  SET decimal_part = NEW.hours - integer_part;
  
  -- ถ้าส่วนทศนิยม > 0.60 ให้เพิ่ม 1 ชั่วโมงและนำส่วนที่เกินไปเป็นทศนิยม
  IF decimal_part > 0.60 THEN
    SET NEW.hours = integer_part + 1.00 + (decimal_part - 0.60);
  END IF;
END;//

CREATE TRIGGER `before_activity_participation_update`
BEFORE UPDATE ON `volunteer_system`.`activity_participation`
FOR EACH ROW
BEGIN
  DECLARE integer_part DECIMAL(10,0);
  DECLARE decimal_part DECIMAL(10,2);
  
  -- แยกส่วนจำนวนเต็มและส่วนทศนิยม
  SET integer_part = FLOOR(NEW.hours);
  SET decimal_part = NEW.hours - integer_part;
  
  -- ถ้าส่วนทศนิยม > 0.60 ให้เพิ่ม 1 ชั่วโมงและนำส่วนที่เกินไปเป็นทศนิยม
  IF decimal_part > 0.60 THEN
    SET NEW.hours = integer_part + 1.00 + (decimal_part - 0.60);
  END IF;
END;//

DELIMITER ;

-- -----------------------------------------------------
-- Table `volunteer_system`.`auth_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`auth_tokens` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `is_invalid` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `token` (`token` ASC),
  INDEX `user_id` (`user_id` ASC),
  INDEX `idx_auth_tokens_validity` (`is_invalid` ASC, `expires_at` ASC),
  CONSTRAINT `auth_tokens_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 66
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `volunteer_system`.`user_bans`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteer_system`.`user_bans` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `reason` TEXT NOT NULL,
  `banned_by` INT(11) NULL DEFAULT NULL,
  `banned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC),
  INDEX `banned_by` (`banned_by` ASC),
  CONSTRAINT `user_bans_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `user_bans_ibfk_2`
    FOREIGN KEY (`banned_by`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
AUTO_INCREMENT = 4
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
  `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC),
  INDEX `granted_by` (`granted_by` ASC),
  CONSTRAINT `user_roles_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2`
    FOREIGN KEY (`granted_by`)
    REFERENCES `volunteer_system`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Existing Triggers
-- -----------------------------------------------------
DELIMITER $$

CREATE TRIGGER `check_email_format_before_insert`
BEFORE INSERT ON `volunteer_system`.`users`
FOR EACH ROW
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email NOT REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'รูปแบบอีเมลไม่ถูกต้อง';
    END IF;
END$$

CREATE TRIGGER `check_email_format_before_update`
BEFORE UPDATE ON `volunteer_system`.`users`
FOR EACH ROW
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email != OLD.email AND NEW.email NOT REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'รูปแบบอีเมลไม่ถูกต้อง';
    END IF;
END$$

CREATE TRIGGER `log_user_role_change`
AFTER UPDATE ON `volunteer_system`.`users`
FOR EACH ROW
BEGIN
    IF OLD.role != NEW.role THEN
        INSERT INTO `volunteer_system`.`user_roles` (user_id, role, granted_by)
        VALUES (NEW.id, NEW.role, NULL);
    END IF;
END$$

CREATE TRIGGER `validate_user_names_before_insert`
BEFORE INSERT ON `volunteer_system`.`users`
FOR EACH ROW
BEGIN
    IF NEW.firstname IS NULL OR TRIM(NEW.firstname) = '' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'ชื่อต้องไม่เป็นค่าว่าง';
    END IF;
    
    IF NEW.lastname IS NULL OR TRIM(NEW.lastname) = '' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'นามสกุลต้องไม่เป็นค่าว่าง';
    END IF;
    
    IF LENGTH(NEW.firstname) > 50 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'ชื่อต้องมีความยาวไม่เกิน 50 ตัวอักษร';
    END IF;
    
    IF LENGTH(NEW.lastname) > 50 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'นามสกุลต้องมีความยาวไม่เกิน 50 ตัวอักษร';
    END IF;
END$$

CREATE TRIGGER `validate_user_names_before_update`
BEFORE UPDATE ON `volunteer_system`.`users`
FOR EACH ROW
BEGIN
    IF NEW.firstname IS NULL OR TRIM(NEW.firstname) = '' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'ชื่อต้องไม่เป็นค่าว่าง';
    END IF;
    
    IF NEW.lastname IS NULL OR TRIM(NEW.lastname) = '' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'นามสกุลต้องไม่เป็นค่าว่าง';
    END IF;
    
    IF LENGTH(NEW.firstname) > 50 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'ชื่อต้องมีความยาวไม่เกิน 50 ตัวอักษร';
    END IF;
    
    IF LENGTH(NEW.lastname) > 50 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'นามสกุลต้องมีความยาวไม่เกิน 50 ตัวอักษร';
    END IF;
END$$

CREATE TRIGGER `update_activity_applications_count_after_delete`
AFTER DELETE ON `volunteer_system`.`activity_applications`
FOR EACH ROW
BEGIN
    -- This trigger can be used in the future if we add a current_participants column
    -- to the activities table for more efficient counting
END$$

CREATE TRIGGER `update_activity_applications_count_after_insert`
AFTER INSERT ON `volunteer_system`.`activity_applications`
FOR EACH ROW
BEGIN
    -- This trigger can be used in the future if we add a current_participants column
    -- to the activities table for more efficient counting
END$$

CREATE TRIGGER `update_user_ban_status`
BEFORE INSERT ON `volunteer_system`.`user_bans`
FOR EACH ROW
BEGIN
    IF NEW.is_active = 1 THEN
        UPDATE `volunteer_system`.`users`
        SET `is_banned` = 1,
            `ban_count` = `ban_count` + 1
        WHERE `id` = NEW.user_id;
    END IF;
END$$

DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;