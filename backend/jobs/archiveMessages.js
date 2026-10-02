const { CronJob } = require("cron");
const { Op } = require("sequelize");

const sequelize = require("../config/db");
const Message = require("../models/Message");
const ArchivedMessage = require("../models/Archivedmessage");
const GroupMessage = require("../models/Groupmessage");
const ArchivedGroupMessage = require("../models/Archivedgroupmessage");
const { logToFile } = require("../utils/logger");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function archivePrivateMessages(cutoff) {
    const t = await sequelize.transaction();

    try {
        const oldMessages = await Message.findAll({
            where: { createdAt: { [Op.lt]: cutoff } },
            transaction: t,
            raw: true,
        });

        if (oldMessages.length > 0) {
            const rows = oldMessages.map((m) => ({
                originalId: m.id,
                text: m.text,
                mediaUrl: m.mediaUrl,
                mediaType: m.mediaType,
                fileName: m.fileName,
                roomName: m.roomName,
                senderId: m.senderId,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
            }));

            await ArchivedMessage.bulkCreate(rows, { transaction: t });

            await Message.destroy({
                where: { createdAt: { [Op.lt]: cutoff } },
                transaction: t,
            });
        }

        await t.commit();
        logToFile(`Archived ${oldMessages.length} private messages`);
        
    } catch (error) {
        await t.rollback();
        logToFile(`ERROR archiving private messages: ${error.message}`);
        
    }
}

async function archiveGroupMessages(cutoff) {
    const t = await sequelize.transaction();

    try {
        const oldMessages = await GroupMessage.findAll({
            where: { createdAt: { [Op.lt]: cutoff } },
            transaction: t,
            raw: true,
        });

        if (oldMessages.length > 0) {
            const rows = oldMessages.map((m) => ({
                originalId: m.id,
                text: m.text,
                mediaUrl: m.mediaUrl,
                mediaType: m.mediaType,
                fileName: m.fileName,
                groupId: m.groupId,
                senderId: m.senderId,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
            }));

            await ArchivedGroupMessage.bulkCreate(rows, { transaction: t });

            await GroupMessage.destroy({
                where: { createdAt: { [Op.lt]: cutoff } },
                transaction: t,
            });
        }

        await t.commit();
         logToFile(`Archived ${oldMessages.length} group messages`);
    } catch (error) {
        await t.rollback();
        logToFile(`ERROR archiving group messages: ${error.message}`);
    }
}

async function archiveOldMessages() {
    const cutoff = new Date(Date.now() - ONE_DAY_MS);

    logToFile(`Archive job started, cutoff: ${cutoff.toISOString()}`);

    await archivePrivateMessages(cutoff);
    await archiveGroupMessages(cutoff);
    logToFile("Archive job finished");
}

function startArchiveJob() {
    const job = new CronJob("0 0 * * *", archiveOldMessages, null, true);

    logToFile("Message archive job scheduled to run every 24 hours");
    return job;
}

module.exports = { startArchiveJob, archiveOldMessages };