import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ResumeInfoContext } from '@/context/ResumeInfoContext'
import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import GlobalApi from './../../../../../service/GlobalApi';
import { Brain, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AIChatSession } from './../../../../../service/AIModal';

const prompt = "Job Title: {jobTitle} , Depends on job title give me list of summery for 3 experience level, Mid Level and Freasher level in 3 -4 lines in array format, With summery and experience_level Field in JSON Format"

function Summery({enabledNext}) {
    const {resumeInfo, setResumeInfo} = useContext(ResumeInfoContext);
    const [summery, setSummery] = useState();
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const [aiGeneratedSummeryList, setAiGenerateSummeryList] = useState([]);
    
    useEffect(() => {
        summery && setResumeInfo({
            ...resumeInfo,
            summery: summery
        })
    }, [summery])

    const GenerateSummeryFromAI = async() => {
        try {
            setLoading(true);
            const PROMPT = prompt.replace('{jobTitle}', resumeInfo?.jobTitle);
            console.log(PROMPT);
            const result = await AIChatSession.sendMessage(PROMPT);
            
            const responseText = result.response.text();
            console.log("Raw response:", responseText);

            const parsedResponse = JSON.parse(responseText);
            console.log("Parsed response:", parsedResponse);
            
            let summeryArray;
            if (Array.isArray(parsedResponse)) {
                summeryArray = parsedResponse;
            } else if (parsedResponse && typeof parsedResponse === 'object') {

                const possibleArrayKeys = Object.keys(parsedResponse).filter(key => 
                    Array.isArray(parsedResponse[key])
                );
                
                if (possibleArrayKeys.length > 0) {
                    summeryArray = parsedResponse[possibleArrayKeys[0]];
                } else {
                   
                    if (parsedResponse.summary || parsedResponse.experience_level) {
                        summeryArray = [parsedResponse];
                    } else {
                      
                        summeryArray = [];
                        toast("Failed to get AI suggestions", { type: "error" });
                    }
                }
            } else {
                summeryArray = [];
                toast("Failed to get AI suggestions", { type: "error" });
            }
            
            setAiGenerateSummeryList(summeryArray);
        } catch (error) {
            console.error("Error generating summary:", error);
            toast("Error generating AI summary", { type: "error" });
            setAiGenerateSummeryList([]);
        } finally {
            setLoading(false);
        }
    }

    const onSave = (e) => {
        e.preventDefault();
       
        setLoading(true);
        const data = {
            data: {
                summery: summery
            }
        };
        
        GlobalApi.UpdateResumeDetail(params?.resumeId, data).then(resp => {
            console.log(resp);
            enabledNext(true);
            setLoading(false);
            toast("Details updated", { type: "success" });
        }, (error) => {
            console.error("Error updating resume details:", error);
            toast("Failed to update details", { type: "error" });
            setLoading(false);
        });
    }
    
    return (
        <div>
            <div className='p-5 shadow-lg rounded-lg border-t-primary border-t-4 mt-10'>
                <h2 className='font-bold text-lg'>Summary</h2>
                <p>Add Summary for your job title</p>

                <form className='mt-7' onSubmit={onSave}>
                    <div className='flex justify-between items-end'>
                        <label>Add Summary</label>
                        <Button 
                            variant="outline" 
                            onClick={() => GenerateSummeryFromAI()} 
                            type="button" 
                            size="sm" 
                            className="border-primary text-primary flex gap-2"
                            disabled={loading || !resumeInfo?.jobTitle}
                        > 
                            {loading ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Brain className='h-4 w-4' />}  
                            Generate from AI
                        </Button>
                    </div>
                    <Textarea 
                        className="mt-5" 
                        required
                        value={summery}
                        defaultValue={summery ? summery : resumeInfo?.summery}
                        onChange={(e) => setSummery(e.target.value)}
                    />
                    <div className='mt-2 flex justify-end'>
                        <Button 
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <LoaderCircle className='animate-spin' /> : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>

            {aiGeneratedSummeryList && aiGeneratedSummeryList.length > 0 && (
                <div className='my-5'>
                    <h2 className='font-bold text-lg'>Suggestions</h2>
                    {aiGeneratedSummeryList.map((item, index) => (
                        <div 
                            key={index} 
                            onClick={() => setSummery(item?.summary)}
                            className='p-5 shadow-lg my-4 rounded-lg cursor-pointer hover:bg-gray-50'
                        >
                            <h2 className='font-bold my-1 text-primary'>Level: {item?.experience_level}</h2>
                            <p>{item?.summary}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Summery