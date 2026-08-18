import { TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { TabsList } from "@/components/ui/tabs";
import { Tabs } from "@/components/ui/tabs";

export function LendingTabsMock() {
  return (
    <Tabs value="lend" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="lend">Lend</TabsTrigger>
        <TabsTrigger value="borrow" disabled>
          Borrow
        </TabsTrigger>
      </TabsList>

      <TabsContent value="lend" className="pt-4">
        {/* Lend functionality would be displayed here */}
      </TabsContent>

      <TabsContent value="borrow" className="pt-4">
        {/* Borrow functionality would be displayed here */}
      </TabsContent>
    </Tabs>
  );
}
