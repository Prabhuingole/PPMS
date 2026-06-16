const fs = require('fs');
let c = fs.readFileSync('e:/sam projects/SPMS/PMS-Frontend/app/superadmin/projects/[id]/page.tsx', 'utf8');
c = c.substring(0, c.indexOf('          managers={managers}'));
c += `                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <Clock className="h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-foreground">No Activity Logged</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">There are no timesheets submitted for this project yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

        <DeleteConfirmationModal
          isOpen={docToDelete !== null}
          onOpenChange={(open) => !open && setDocToDelete(null)}
          onConfirm={handleDeleteDocument}
          title="Delete Document?"
          itemName="this document"
          isDeleting={isDeleting}
        />
        
        <ProjectFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingProject={project}
          managers={managers}
          employees={employees}
          onSuccess={() => {
            fetchData();
          }}
        />
    </div>
  );
}
`;
fs.writeFileSync('e:/sam projects/SPMS/PMS-Frontend/app/superadmin/projects/[id]/page.tsx', c);
