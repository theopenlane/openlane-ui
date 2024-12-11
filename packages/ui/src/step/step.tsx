import { Avatar, AvatarFallback, AvatarImage } from '../avatar/avatar'
import { Button } from "../button/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../cardpanel/card";
import { Badge, Link } from "lucide-react";

export interface WizardProps {

    numSteps: number;
}

export const Wizard = ({ numSteps }: WizardProps) => {
    return (
        <Card className="mx-auto p-4">
            <CardHeader>
                <CardTitle>Step Wizard</CardTitle>
                <CardDescription>Navigate through the steps to complete the process</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4">
                    {Array.from({ length: numSteps }, (_, index) => (
                        <Badge key={index} className="text-sm font-medium bg-blue-200 text-blue-800">
                            Step {index + 1}
                        </Badge>
                    ))}
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-4">
                        <Avatar>
                            <AvatarImage src="/placeholder.svg?height=50&width=50" alt="User Image" className="w-12 h-12" />
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">User Name</span>
                            <span className="text-sm text-gray-600">User Details</span>
                        </div>
                    </div>
                    <Button className="w-full">Continue to Step 2</Button>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4">
                <Link href="#" className="text-blue-600 hover:underline">
                    Skip this step
                </Link>
                <Link href="#" className="text-blue-600 hover:underline">
                    Need help?
                </Link>
            </CardFooter>
        </Card>
    )
}