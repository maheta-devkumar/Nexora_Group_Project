import React, { createContext, useContext, useState, useCallback } from 'react';
import * as categoryApi from '../api/category';

const CategoryContext = createContext();

export const useCategoryContext = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategoryContext must be used within CategoryProvider');
    }
    return context;
};

export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [currentSubcategory, setCurrentSubcategory] = useState(null);
    const [allSubcategories, setAllSubcategories] = useState([]);
    const [categorySubcategories, setCategorySubcategories] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all categories
    const fetchAllCategories = useCallback(async () => {
        console.log("🔍 CATEGORY CONTEXT: Fetching all categories");
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.fetchAllCategories();
            console.log("🔍 CATEGORY CONTEXT: Fetch result:", result);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Categories fetched:", result.data.length);
                setCategories(result.data || []);
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Fetch categories failed:", result.message);
                setError(result.message);
                return [];
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Fetch categories error:", err);
            setError('Failed to fetch categories');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch category by ID
    const fetchCategoryById = useCallback(async (categoryId) => {
        console.log(`🔍 CATEGORY CONTEXT: Fetching category ID: ${categoryId}`);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.fetchCategoryById(categoryId);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Category fetched successfully");
                setCurrentCategory(result.data);
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Fetch category failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Fetch category error:", err);
            setError('Failed to fetch category');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all subcategories
    const fetchAllSubcategories = useCallback(async () => {
        console.log("🔍 CATEGORY CONTEXT: Fetching all subcategories");
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.fetchAllSubcategories();
            console.log("🔍 CATEGORY CONTEXT: Fetch result:", result);
            
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Subcategories fetched:", result.data?.length || 0);
                
                // DEBUG: Check data types
                if (result.data && Array.isArray(result.data)) {
                    result.data.forEach((item, index) => {
                        console.log(`DEBUG Item ${index}:`, {
                            sub_category_id: item.sub_category_id,
                            sub_category_id_type: typeof item.sub_category_id,
                            category_id: item.category_id,
                            category_id_type: typeof item.category_id,
                            is_category_id_int: Number.isInteger(item.category_id)
                        });
                    });
                }
                
                setAllSubcategories(result.data || []);
                
                // Group subcategories by category_id
                const grouped = {};
                if (result.data && Array.isArray(result.data)) {
                    result.data.forEach(sub => {
                        // Ensure category_id is treated as string for grouping
                        const categoryId = String(sub.category_id || 'unknown');
                        if (!grouped[categoryId]) {
                            grouped[categoryId] = {
                                category_id: sub.category_id,
                                category_name: sub.category_name || `Category ${sub.category_id}`,
                                subcategories: []
                            };
                        }
                        grouped[categoryId].subcategories.push(sub);
                    });
                }
                
                setCategorySubcategories(grouped);
                
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Fetch subcategories failed:", result.message);
                setError(result.message || "Failed to fetch subcategories");
                return [];
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Fetch subcategories error:", err);
            setError(err.message || 'Failed to fetch subcategories');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch subcategory by ID
    const fetchSubcategoryById = useCallback(async (subcategoryId) => {
        console.log(`🔍 CATEGORY CONTEXT: Fetching subcategory ${subcategoryId}`);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.fetchSubcategoryById(subcategoryId);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Subcategory fetched successfully");
                setCurrentSubcategory(result.data);
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Fetch subcategory failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Fetch subcategory error:", err);
            setError('Failed to fetch subcategory');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch subcategories for a specific category
    const fetchSubcategoriesForCategory = useCallback(async (categoryId) => {
        console.log(`🔍 CATEGORY CONTEXT: Fetching subcategories for category ${categoryId}`);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.fetchCategoryWithSubcategories(categoryId);
            if (result.success) {
                const subs = result.data?.subcategories || [];
                setCategorySubcategories(prev => ({
                    ...prev,
                    [categoryId]: subs
                }));
                return subs;
            } else {
                setError(result.message);
                return [];
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Fetch subcategories error:", err);
            setError('Failed to fetch subcategories');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Get subcategories for a category (from local state)
    const getSubcategories = (categoryId) => {
        return categorySubcategories[categoryId] || [];
    };

    // Create category
    const createCategory = async (categoryData) => {
        console.log("🔍 CATEGORY CONTEXT: Creating category:", categoryData);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.createCategory(categoryData);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Category created successfully");
                setCategories(prev => [...prev, result.data]);
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Create category failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Create category error:", err);
            setError('Failed to create category');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Update category
    const updateCategory = async (categoryId, updateData) => {
        console.log(`🔍 CATEGORY CONTEXT: Updating category ${categoryId}:`, updateData);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.updateCategory(categoryId, updateData);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Category updated successfully");
                setCategories(prev => 
                    prev.map(cat => cat.category_id === categoryId ? result.data : cat)
                );
                if (currentCategory?.category_id === categoryId) {
                    setCurrentCategory(result.data);
                }
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Update category failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Update category error:", err);
            setError('Failed to update category');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Delete category
    const deleteCategory = async (categoryId) => {
        console.log(`🔍 CATEGORY CONTEXT: Deleting category ${categoryId}`);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.deleteCategory(categoryId);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Category deleted successfully");
                setCategories(prev => prev.filter(cat => cat.category_id !== categoryId));
                if (currentCategory?.category_id === categoryId) {
                    setCurrentCategory(null);
                }
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Delete category failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Delete category error:", err);
            setError('Failed to delete category');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Create subcategory
    const createSubcategory = async (subcategoryData) => {
        console.log("🔍 CATEGORY CONTEXT: Creating subcategory:", subcategoryData);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.createSubcategory(subcategoryData);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Subcategory created successfully");
                
                // Add to allSubcategories
                setAllSubcategories(prev => [...prev, result.data]);
                
                // Add to categorySubcategories
                const categoryId = subcategoryData.category_id;
                setCategorySubcategories(prev => ({
                    ...prev,
                    [categoryId]: [...(prev[categoryId] || []), result.data]
                }));
                
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Create subcategory failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Create subcategory error:", err);
            setError('Failed to create subcategory');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Update subcategory
    const updateSubcategory = async (subcategoryId, updateData) => {
        console.log(`🔍 CATEGORY CONTEXT: Updating subcategory ${subcategoryId}:`, updateData);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.updateSubcategory(subcategoryId, updateData);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Subcategory updated successfully");
                
                // Update in allSubcategories
                setAllSubcategories(prev => 
                    prev.map(sub => sub.sub_category_id === subcategoryId ? result.data : sub)
                );
                
                // Update in categorySubcategories
                if (result.data.category_id) {
                    const categoryId = result.data.category_id;
                    setCategorySubcategories(prev => ({
                        ...prev,
                        [categoryId]: prev[categoryId]?.map(sub => 
                            sub.sub_category_id === subcategoryId ? result.data : sub
                        ) || []
                    }));
                }
                
                if (currentSubcategory?.sub_category_id === subcategoryId) {
                    setCurrentSubcategory(result.data);
                }
                
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Update subcategory failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Update subcategory error:", err);
            setError('Failed to update subcategory');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Delete subcategory
    const deleteSubcategory = async (subcategoryId, categoryId) => {
        console.log(`🔍 CATEGORY CONTEXT: Deleting subcategory ${subcategoryId}`);
        setLoading(true);
        setError(null);
        try {
            const result = await categoryApi.deleteSubcategory(subcategoryId);
            if (result.success) {
                console.log("🔍 CATEGORY CONTEXT: Subcategory deleted successfully");
                
                // Remove from allSubcategories
                setAllSubcategories(prev => 
                    prev.filter(sub => sub.sub_category_id !== subcategoryId)
                );
                
                // Remove from categorySubcategories
                if (categoryId) {
                    setCategorySubcategories(prev => ({
                        ...prev,
                        [categoryId]: prev[categoryId]?.filter(sub => sub.sub_category_id !== subcategoryId) || []
                    }));
                }
                
                if (currentSubcategory?.sub_category_id === subcategoryId) {
                    setCurrentSubcategory(null);
                }
                
                return result.data;
            } else {
                console.error("🔍 CATEGORY CONTEXT: Delete subcategory failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CATEGORY CONTEXT: Delete subcategory error:", err);
            setError('Failed to delete subcategory');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Clear error
    const clearError = () => {
        console.log("🔍 CATEGORY CONTEXT: Clearing error");
        setError(null);
    };

    // Clear current category
    const clearCurrentCategory = () => {
        console.log("🔍 CATEGORY CONTEXT: Clearing current category");
        setCurrentCategory(null);
    };

    // Clear current subcategory
    const clearCurrentSubcategory = () => {
        console.log("🔍 CATEGORY CONTEXT: Clearing current subcategory");
        setCurrentSubcategory(null);
    };

    // Refresh all data
    const refreshAllData = async () => {
        console.log("🔍 CATEGORY CONTEXT: Refreshing all data");
        await fetchAllCategories();
        await fetchAllSubcategories();
    };

    const value = {
        categories,
        currentCategory,
        currentSubcategory,
        allSubcategories,
        categorySubcategories,
        loading,
        error,
        fetchAllCategories,
        fetchCategoryById,
        fetchAllSubcategories,
        fetchSubcategoryById,
        fetchSubcategoriesForCategory,
        getSubcategories,
        createCategory,
        updateCategory,
        deleteCategory,
        createSubcategory,
        updateSubcategory,
        deleteSubcategory,
        clearError,
        clearCurrentCategory,
        clearCurrentSubcategory,
        refreshAllData
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
};

export default CategoryContext;