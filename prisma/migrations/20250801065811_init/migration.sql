BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000),
    [emailVerified] DATETIME2,
    [role] NVARCHAR(1000),
    [status] NVARCHAR(1000),
    [image] NVARCHAR(1000),
    [token] NVARCHAR(1000),
    [shiftId] INT,
    [counterId] INT,
    [stationId] INT,
    [password_reset_token] NVARCHAR(1000),
    [password_reset_expires] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[records] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticket] NVARCHAR(1000) NOT NULL,
    [recordType] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [service] NVARCHAR(1000) NOT NULL,
    [subService] NVARCHAR(1000),
    [recordNumber] NVARCHAR(1000),
    [value] INT NOT NULL,
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [records_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [records_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EditedRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [recordId] INT NOT NULL,
    [ticket] NVARCHAR(1000) NOT NULL,
    [recordType] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [service] NVARCHAR(1000) NOT NULL,
    [subService] NVARCHAR(1000),
    [recordNumber] NVARCHAR(1000) NOT NULL,
    [value] INT NOT NULL,
    [reason] NVARCHAR(1000),
    [comment] NVARCHAR(1000),
    [status] NVARCHAR(1000),
    [billerId] INT NOT NULL,
    [supervisorId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [EditedRecord_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [EditedRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Account] (
    [userId] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [providerAccountId] NVARCHAR(1000) NOT NULL,
    [refresh_token] NVARCHAR(1000),
    [access_token] NVARCHAR(1000),
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [id_token] NVARCHAR(1000),
    [session_state] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Account_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([provider],[providerAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [sessionToken] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [expires] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Session_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Session_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateTable
CREATE TABLE [dbo].[VerificationToken] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [VerificationToken_pkey] PRIMARY KEY CLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[stations] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [stations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [stations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [stations_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[shifts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [shifts_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [stationId] INT NOT NULL,
    CONSTRAINT [shifts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [shifts_stationId_name_key] UNIQUE NONCLUSTERED ([stationId],[name])
);

-- CreateTable
CREATE TABLE [dbo].[counters] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [counters_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [shiftId] INT NOT NULL,
    CONSTRAINT [counters_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [counters_shiftId_name_key] UNIQUE NONCLUSTERED ([shiftId],[name])
);

-- CreateTable
CREATE TABLE [dbo].[services] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [services_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [services_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [services_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[subservices] (
    [id] INT NOT NULL IDENTITY(1,1),
    [service_id] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [subservices_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [subservices_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [subservices_service_id_name_key] UNIQUE NONCLUSTERED ([service_id],[name])
);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_shiftId_fkey] FOREIGN KEY ([shiftId]) REFERENCES [dbo].[shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_counterId_fkey] FOREIGN KEY ([counterId]) REFERENCES [dbo].[counters]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_stationId_fkey] FOREIGN KEY ([stationId]) REFERENCES [dbo].[stations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[records] ADD CONSTRAINT [records_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[EditedRecord] ADD CONSTRAINT [EditedRecord_recordId_fkey] FOREIGN KEY ([recordId]) REFERENCES [dbo].[records]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EditedRecord] ADD CONSTRAINT [EditedRecord_billerId_fkey] FOREIGN KEY ([billerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EditedRecord] ADD CONSTRAINT [EditedRecord_supervisorId_fkey] FOREIGN KEY ([supervisorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Account] ADD CONSTRAINT [Account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Session] ADD CONSTRAINT [Session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[shifts] ADD CONSTRAINT [shifts_stationId_fkey] FOREIGN KEY ([stationId]) REFERENCES [dbo].[stations]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[counters] ADD CONSTRAINT [counters_shiftId_fkey] FOREIGN KEY ([shiftId]) REFERENCES [dbo].[shifts]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[subservices] ADD CONSTRAINT [subservices_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [dbo].[services]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
