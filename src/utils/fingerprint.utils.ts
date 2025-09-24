import crypto from "crypto";
import { Request } from "express";

const fingerprints: string[] = [];

export const fingerprint = {
    create(req: Request): string {
        const userAgent = req.headers["user-agent"] || "";
        const ip = req.headers["x-forwarded-for"] || "";
        const acceptLang = req.headers["accept-language"] || "";

        const raw = `${userAgent}|${ip}|${acceptLang}`;
        return crypto.createHash("sha256").update(raw).digest("hex");
    },

    clear(): void {
        fingerprints.length = 0; // reset in place
    },

    add(fp: string): boolean {
        if (fingerprints.includes(fp)) return false;
        fingerprints.push(fp);
        return true;
    },

    has(fp: string): boolean {
        return fingerprints.includes(fp);
    },

    all(): string[] {
        return fingerprints;
    },
};
