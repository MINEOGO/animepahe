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
    const [instantMode, setInstantMode] = useState(false); // Toggle state

    const fetchAllLinks = async () => {
        setLoading(true);
        setLinks([]);
        setIsDone(false);
        const collectedLinks: string[] = [];

        try {
            for (let page = 1; page <= totalPages; page++) {
                setStatus(`Processing Page ${page}/${totalPages}...`);
                setProgress(((page - 1) / totalPages) * 100);

                // 1. Get Episodes
                const epData = await request<EpisodeResult>({
                    server: ANIME,
                    endpoint: `/?method=series&session=${session}&page=${page}`,
                    method: 'GET'
                });

                if (!epData || !epData.episodes) continue;

                // 2. Process Episodes
                // We use a for...of loop here if instantMode is on to prevent overwhelming the worker
                // otherwise Promise.all is fine for just getting Kwik links
                
                if (instantMode) {
                    // Sequential processing for Instant Mode to respect rate limits/reliability
                    for (const ep of epData.episodes) {
                         const linkData = await request<DownloadLinks>({
                            server: ANIME,
                            endpoint: `/?method=episode&session=${session}&ep=${ep.session}`,
                            method: 'GET'
                        });

                        if (linkData && linkData.length > 0) {
                            let targetLink = linkData.find(l => l.name.includes("1080")) || linkData[linkData.length - 1];
                            let finalUrl = targetLink.link;

                            // BYPASS LOGIC
                            setStatus(`Bypassing ${ep.episode}...`);
                            const bypassData = await request<DirectLink>({
                                server: KWIK,
                                endpoint: `/?url=${encodeURIComponent(finalUrl)}`,
                                method: 'GET'
                            });

                            if (bypassData && bypassData.success) {
                                finalUrl = bypassData.url;
                            } else {
                                finalUrl = `${finalUrl} (Bypass Failed)`;
                            }

                            collectedLinks.push(`${ep.episode}: ${finalUrl}`);
                        }
                    }
                } else {
                    // Standard Parallel Fetch (Fast)
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
        toast.success("Copied all links to clipboard!");
    };

    const openAllTabs = () => {
        if (links.length > 10) {
            if(!confirm(`You are about to open ${links.length} tabs. This might crash your browser. Continue?`)) return;
        }
        links.forEach(l => {
            const url = l.split(': ')[1];
            if (!url.includes("Failed")) {
                window.open(url, '_blank');
            }
        });
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
                                                <span className="text-small font-bold">Instant Mode</span>
                                                <span className="text-tiny text-default-500">Automatically convert Kwik links to Direct MP4 links</span>
                                            </div>
                                            <Switch 
                                                isSelected={instantMode} 
                                                onValueChange={setInstantMode}
                                                color="warning"
                                                thumbIcon={({ isSelected, className }) =>
                                                    isSelected ? (
                                                        <Zap className={className} />
                                                    ) : (
                                                        <ExternalLink className={className} />
                                                    )
                                                }
                                            />
                                        </div>
                                        {instantMode && (
                                            <p className="text-tiny text-warning">
                                                Note: Instant mode is slower because it processes episodes sequentially to bypass protection.
                                            </p>
                                        )}
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
                                        placeholder="Links will appear here..."
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
                                    {instantMode ? "Start Instant Batch" : "Fetch Kwik Links"}
                                </Button>
                            )}
                            {isDone && (
                                <div className="flex gap-2 w-full">
                                    <Button color="secondary" variant="flat" onPress={copyToClipboard} startContent={<Copy size={18}/>} className="flex-1">
                                        Copy Links
                                    </Button>
                                    <Button color="primary" variant="flat" onPress={openAllTabs} startContent={<ExternalLink size={18}/>} className="flex-1">
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
