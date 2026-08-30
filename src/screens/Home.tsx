import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, FileText, Users, LogOut, Plus, Trash2Icon } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from '@/components/Logo';
import useAuth from '@/hook/useAuth';
import useProfile from '@/hook/useProfile';
import useDocument from '@/hook/useDocument';
import { Document } from '@/types/document';
import { toTime } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { createDocument, getDocuments, deleteDocumentById, documentErr, loading } = useDocument();
  const { createUserProfile, getUserProfile, noProfile } = useProfile();
  const { notify, toastElement } = useToast();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [whose, setWhose] = useState<string>('mine');
  const [reload, setReload] = useState<boolean>(false);
  const [docs, setDocs] = useState<Document[]>([]);

  useEffect(() => {
    const refresh = async () => {
      const myDocs = await getDocuments(whose);

      if (myDocs) {
        setDocs(myDocs);
      }
    }

    refresh();
  }, [reload, whose])


  useEffect(() => {
    const checkProfile = async () => {
      const checkProfile = await getUserProfile();

      if (!checkProfile && noProfile) {
        await createUserProfile();
      }
    }

    checkProfile();
  }, [noProfile]);


  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  const createNewDocument = async () => {
    const newDoc = await createDocument();
    if (documentErr || !newDoc || !newDoc.id) {
      notify(`Could not create the document: ${documentErr}`, 'error')
      return;
    }
    setReload(!reload);
    navigate(`/document/${newDoc.id}`)
  }

  const handleDeleteDoc = async (docId: string) => {
    await deleteDocumentById(docId);
    setReload(!reload);
  }

  const filterDocuments = (docs: Document[]) => {
    return docs.filter(doc => 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  return (
    <div className='container h-screen p-4 flex flex-col justify-start items-start'>
      {toastElement}
      <div className='w-full flex flex-row justify-between items-center'>
        <Logo />
        <Button onClick={handleLogout}>
          <LogOut />
          Logout
        </Button>
      </div>
      <div className="container mx-auto p-4 max-w-4xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Documents</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documents"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={createNewDocument} className="w-full">
            <Plus/>
            New Document
          </Button>
        </div>

        <Tabs defaultValue="my-documents" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-documents" onClick={() => setWhose('mine')}>My Documents</TabsTrigger>
            <TabsTrigger value="shared-with-me" onClick={() => setWhose('shared')}>Shared with Me</TabsTrigger>
          </TabsList>
          {loading && <div> Loading... </div>}
          {!loading && !docs.length && <div>No documents have been created yet.</div>}
          {!loading && docs.length !== 0 &&
            <>
              <TabsContent value="my-documents">
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterDocuments(docs).map((doc: Document) => (
                      <Card key={doc.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <Link to={`/document/${doc.id}`}>
                          <CardTitle className="text-sm font-medium hover:underline">
                              {doc.title? doc.title : 'Untitled'}
                          </CardTitle>
                          </Link>
                          <span className="w-10 flex flex-row items-center justify-between space-y-0 pb-2">
                            <FileText className="h-4 w-4 text-muted-foreground"/>
                            <Trash2Icon className="h-4 w-4 text-muted-foreground hover:text-black hover:cursor-pointer" onClick={() => handleDeleteDoc(doc.id as string)}/>
                          </span>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>Last edited: {toTime(doc.updatedAt.toString())}</CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="shared-with-me">
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterDocuments(docs).map((doc: Document) => (
                      <Link key={doc.id} to={`/document/${doc.id}`}>
                        <Card className='hover:bg-gray-200'>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {doc.title? doc.title : 'Untitled'}
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <CardDescription>
                              Shared by: {doc.ownerId}
                            </CardDescription>
                            <CardDescription>
                              Last edited: {toTime(doc.updatedAt.toString())}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </>
          }
        </Tabs>
      </div>
    </div>
  )
}