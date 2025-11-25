import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Progress, Textarea, Switch } from "@nextui-org/react";
import { useState } from "react";
import useAxios from "../hooks/useAxios";
import { ANIME, KWIK } from "../config/config";
import { EpisodeResult, DownloadLinks, DirectLink } from "fetch/requests";
import { Copy, ExternalLink, Zap } from "lucide-react";
import toast from "react-hot-toast";

interface BatchModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    session: string;
    title: string;
    totalPages: number;
}

const BatchModal = ({ isOpen, onOpenChange, session, title, totalPages }: BatchModalProps) => {
    const { request } = useAxios();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");
    const [links, setLinks] = useState<string[]>([]);
    const [isDone, setIsDone] = useState(false);
    const [instantMode, setInstantMode] = useState(false);

    const fetchAllLinks = async () => {
        setLoading(true);
        setLinks([]);
        setIsDone(false);
        const collectedLinks: string[] = [];

        try {
            for (let page = 1; page <= totalPages; page++) {
                setStatus(`Processing Page ${page}/${totalPages}...`);
                setProgress(((page - 1) / totalPages) * 100);

                const epData = await request<EpisodeResult>({
                    server: ANIME,
                    endpoint: `/?method=series&session=${session}&page=${page}`,
                    method: 'GET'
                });

                if (!epData || !epData.episodes) continue;

                if (instantMode) {
                    // Sequential processing for Instant Mode
                    for (const ep of epData.episodes) {
                         const linkData = await request<DownloadLinks>({
                            server: ANIME,
                            endpoint: `/?method=episode&session=${session}&ep=${ep.session}`,
                            method: 'GET'
                        });

                        if (linkData && linkData.length > 0) {
                            let targetLink = linkData.find(l => l.name.includes("1080")) || linkData[linkData.length - 1];
                            let finalUrl = targetLink.link;

                            setStatus(`Bypassing ${ep.episode}...`);
                            const bypassData = await request<DirectLink>({
                                server: KWIK,
                                endpoint: `/?url=${encodeURIComponent(finalUrl)}`,
                                method: 'GET'
                            });

                            if (bypassData && bypassData.success) {
                                // Custom Filename Construction
                                const safeTitle = title.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
                                const filename = `${safeTitle}_${ep.episode}_animepahe-26e.pages.dev_.mp4`;
                                
                                finalUrl = `${ANIME}/proxy?proxyUrl=${encodeURIComponent(bypassData.url)}&modify&download&filename=${encodeURIComponent(filename)}`;
                            } else {
                                finalUrl = `${finalUrl} (Bypass Failed)`;
                            }

                            collectedLinks.push(`${ep.episode}: ${finalUrl}`);
                        }
                    }
                } else {
                    // Parallel processing for normal mode
                    const episodePromises = epData.episodes.map(async (ep) => {
                        const linkData = await request<DownloadLinks>({
                            server: ANIME,
                            endpoint: `/?method=episode&session=${session}&ep=${ep.session}`,
                            method: 'GET'
                        });

                        if (linkData && linkData.length > 0) {
                            const bestLink = linkData.find(l => l.name.includes("1080")) || linkData[linkData.length - 1];
                            return `${ep.episode}: ${bestLink.link}`;
                        }
                        return null;
                    });

                    const results = await Promise.all(episodePromises);
                    results.forEach(r => { if (r) collectedLinks.push(r); });
                }
            }

            setLinks(collectedLinks);
            setStatus("Complete!");
            setProgress(100);
            setIsDone(true);
            toast.success(`Fetched ${collectedLinks.length} links!`);

        } catch (e) {
            setStatus("Error occurred.");
            toast.error("Batch fetch failed.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        const urlList = links.map(l => l.split(': ')[1]).join('\n');
        navigator.clipboard.writeText(urlList);
        toast.success("Copied all links!");
    };

    const downloadAll = () => {
        if (links.length > 10 && !instantMode) {
            if(!confirm(`This will open ${links.length} tabs/downloads. Continue?`)) return;
        }

        let delay = 0;
        links.forEach(l => {
            const url = l.split(': ')[1];
            if (!url.includes("Failed")) {
                setTimeout(() => {
                    if (instantMode) {
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = url;
                        document.body.appendChild(iframe);
                        setTimeout(() => document.body.removeChild(iframe), 60000);
                    } else {
                        window.open(url, '_blank');
                    }
                }, delay);
                delay += 1500;
            }
        });
        toast.success("Downloads started!");
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" backdrop="blur" isDismissable={!loading}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Bulk Download: {title}
                            <span className="text-tiny text-default-400">{totalPages} Pages</span>
                        </ModalHeader>
                        <ModalBody>
                            {!isDone && !loading && (
                                <div className="flex flex-col gap-4 py-2">
                                    <div className="bg-default-100 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-small font-bold">Instant Mode (Proxy)</span>
                                                <span className="text-tiny text-default-500">Convert to Direct Download Links</span>
                                            </div>
                                            <Switch 
                                                isSelected={instantMode} 
                                                onValueChange={setInstantMode}
                                                color="warning"
                                                thumbIcon={({ isSelected, className }) =>
                                                    isSelected ? <Zap className={className} /> : <ExternalLink className={className} />
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(loading || isDone) && (
                                <div className="flex flex-col gap-4">
                                    <Progress 
                                        aria-label="Downloading..." 
                                        size="md" 
                                        value={progress} 
                                        color={instantMode ? "warning" : "success"} 
                                        showValueLabel={true} 
                                        className="max-w-md mx-auto" 
                                    />
                                    <p className="text-center text-sm">{status}</p>
                                </div>
                            )}

                            {isDone && (
                                <div className="mt-4">
                                    <Textarea
                                        label="Generated Links"
                                        value={links.join('\n')}
                                        readOnly
                                        minRows={10}
                                        maxRows={15}
                                        variant="bordered"
                                    />
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            {!loading && !isDone && (
                                <Button 
                                    color={instantMode ? "warning" : "primary"} 
                                    onPress={fetchAllLinks} 
                                    className="w-full text-white"
                                    startContent={instantMode ? <Zap size={18}/> : <Copy size={18}/>}
                                >
                                    {instantMode ? "Generate" : "Fetch Links"}
                                </Button>
                            )}
                            {isDone && (
                                <div className="flex gap-2 w-full">
                                    <Button color="secondary" variant="flat" onPress={copyToClipboard} startContent={<Copy size={18}/>} className="flex-1">
                                        Copy Links
                                    </Button>
                                    <Button color="primary" variant="flat" onPress={downloadAll} startContent={<ExternalLink size={18}/>} className="flex-1">
                                        Download All
                                    </Button>
                                </div>
                            )}
                            {!loading && (
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default BatchModal;
