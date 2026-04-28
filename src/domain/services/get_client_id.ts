import net from "node:net";

// returns the client ip address
// TODO: add api-key header check -> getClientId()
export default function getClientIP(req: Request): string | undefined {
	const forwarded = req.headers.get("x-forwarded-for"); // X-Forwarded-For header
	if (forwarded) {
		const ip = forwarded.split(",")[0]?.trim();
		if (ip && net.isIP(ip)) return ip;
	}
	const realIp = req.headers.get("x-real-ip"); // X-Real-IP header
	if (realIp) {
		const ip = realIp.trim();
		if (net.isIP(ip)) return ip;
	}
	return undefined;
}
