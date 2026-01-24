'use client'

import { useState, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tag, Plus, Edit, Trash2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from '@/components/ui/spinner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          count: 0,
          status: c.is_active ? 'Active' : 'Inactive'
        })))
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })
      
      if (response.ok) {
        await fetchCategories()
        setIsAddingCategory(false)
        setNewCategory({ name: '', description: '' })
        alert('Global category added successfully!')
      }
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const handleEditCategory = async () => {
    try {
      const response = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedCategory)
      })
      
      if (response.ok) {
        await fetchCategories()
        setIsEditingCategory(false)
        setSelectedCategory(null)
        alert('Global category updated successfully!')
      }
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this global category?')) {
      try {
        const response = await fetch(`/api/admin/categories/${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await fetchCategories()
          alert('Global category deleted successfully!')
        }
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Category Management
              </h1>
            </div>
            <p className="text-gray-600">Manage global categories visible to all pharmacies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-sm text-muted-foreground">Total Categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{categories.filter(c => c.status === 'Active').length}</div>
                <p className="text-sm text-muted-foreground">Active Categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{categories.filter(c => c.status === 'Inactive').length}</div>
                <p className="text-sm text-muted-foreground">Inactive Categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{categories.reduce((sum, c) => sum + c.count, 0)}</div>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>Manage product and service categories</CardDescription>
                </div>
                <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Category Name</Label>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                        />
                      </div>
                      <Button onClick={handleAddCategory} disabled={!newCategory.name}>
                        Add Category
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input placeholder="Search categories..." className="flex-1" />
              </div>
              
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-lg">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={category.status === 'Active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {category.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{category.count} products</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedCategory(category)
                        setIsEditingCategory(true)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
              </DialogHeader>
              {selectedCategory && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Category Name</Label>
                    <Input
                      value={selectedCategory.name}
                      onChange={(e) => setSelectedCategory({...selectedCategory, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={selectedCategory.description}
                      onChange={(e) => setSelectedCategory({...selectedCategory, description: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleEditCategory}>Save Changes</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
    </div>
  );
}
